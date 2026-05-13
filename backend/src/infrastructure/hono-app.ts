import { Hono, type Context, type Next } from 'hono';
import { cors } from 'hono/cors';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { describeRoute, openAPIRouteHandler, resolver } from 'hono-openapi';
import type { AppController } from '../controllers/app-controller';
import type { TodoController } from '../controllers/todo-controller';
import type { JsonHttpResponse } from '../controllers/http-presenter';
import {
  AppDtoSchema,
  ErrorResponseSchema,
  SuccessResponseSchema,
  TodoDtoSchema,
} from '../controllers/schemas';
import { z } from 'zod';
import { parseUpdateUserProfileInput } from './user-profile-validation';
import type { AuthUsecase } from '../services/auth-usecase';
import { isAppError } from '../models/app-error';
import type { UserRepository } from '../repositories/user-repository';

const AppSuccessSchema = SuccessResponseSchema(AppDtoSchema);
const AppListSuccessSchema = SuccessResponseSchema(z.array(AppDtoSchema));
const TodoSuccessSchema = SuccessResponseSchema(TodoDtoSchema);
const TodoListSuccessSchema = SuccessResponseSchema(z.array(TodoDtoSchema));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorResponses = {
  401: {
    description: 'Authentication required or token is invalid.',
    content: { 'application/json': { schema: resolver(ErrorResponseSchema) } },
  },
  403: {
    description: 'Authenticated user does not own the requested resource.',
    content: { 'application/json': { schema: resolver(ErrorResponseSchema) } },
  },
  404: {
    description: 'Resource not found.',
    content: { 'application/json': { schema: resolver(ErrorResponseSchema) } },
  },
  409: {
    description: 'Conflict — unique constraint violated.',
    content: { 'application/json': { schema: resolver(ErrorResponseSchema) } },
  },
  422: {
    description: 'Validation error in request body.',
    content: { 'application/json': { schema: resolver(ErrorResponseSchema) } },
  },
  500: {
    description: 'Unexpected server error.',
    content: { 'application/json': { schema: resolver(ErrorResponseSchema) } },
  },
} as const;

type AppEnv = {
  Variables: {
    userId: string;
  };
};

/**
 * Determines if a request path should be logged.
 * Only logs /api/* paths, skips other routes like /, /doc, etc.
 * @param {string} path The request path to check
 * @returns {boolean} true if the path should be logged, false otherwise
 */
function shouldLogPath(path: string): boolean {
  return path.startsWith('/api/');
}

/**
 * Determines if a status code represents a successful response (2xx).
 * @param {number} status HTTP status code
 * @returns {boolean} true if status is in the 200-299 range, false otherwise
 */
function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Determines if a status code represents an error response (4xx or 5xx).
 * @param {number} status HTTP status code
 * @returns {boolean} true if status is in the 400-599 range, false otherwise
 */
function isErrorStatus(status: number): boolean {
  return status >= 400 && status < 600;
}

/**
 * Logs a successful API request with format: [METHOD] path → status (Xms)
 * Only logs if LOG_API_REQUESTS environment variable is set to 'true'.
 * @param {string} method HTTP method (GET, POST, etc.)
 * @param {string} path Request path
 * @param {number} status HTTP status code
 * @param {number} elapsedTimeMs Response time in milliseconds
 * @returns {void}
 */
function logSuccessRequest(method: string, path: string, status: number, elapsedTimeMs: number): void {
  if (process.env.LOG_API_REQUESTS !== 'true') {
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`[${method}] ${path} → ${status} (${elapsedTimeMs}ms)`);
}

/**
 * Extracts error code and message from the response body JSON.
 * Expects response to follow structure: { error: { code: string, message: string } }
 * Returns null if the response body cannot be parsed, lacks an error property,
 * or the error property does not have the expected shape.
 *
 * Side effects:
 * - Clones the response body (does not affect the original response)
 * - Logs warnings to console.warn() when extraction fails
 *
 * Performance considerations:
 * - Response body is fully parsed for every error response
 * - Skipped if response body exceeds 10KB to prevent performance degradation
 * @param {Context} context Hono context for response extraction
 * @returns {Promise<{code: string; message: string} | null>} Extracted error details or null if extraction fails
 */
async function extractErrorDetails(context: Context): Promise<{ code: string; message: string } | null> {
  try {
    const clonedResponse = context.res.clone();
    const responseText = await clonedResponse.text();

    // Guard: Skip parsing if response is too large
    if (responseText.length > 10240) {
      // eslint-disable-next-line no-console
      console.warn('[logging] Response body too large for error extraction:', responseText.length, 'bytes');
      return null;
    }

    const responseBody = JSON.parse(responseText) as unknown;

    if (
      typeof responseBody !== 'object' ||
      responseBody === null ||
      !('error' in responseBody)
    ) {
      // eslint-disable-next-line no-console
      console.warn('[logging] Response body missing "error" property');
      return null;
    }

    const errorObj = responseBody.error;

    if (
      typeof errorObj !== 'object' ||
      errorObj === null ||
      !('code' in errorObj) ||
      !('message' in errorObj) ||
      typeof errorObj.code !== 'string' ||
      typeof errorObj.message !== 'string'
    ) {
      // eslint-disable-next-line no-console
      console.warn('[logging] Error object has unexpected structure or non-string code/message');
      return null;
    }

    return { code: errorObj.code, message: errorObj.message };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      '[logging] Failed to extract error details from response body:',
      error instanceof Error ? error.message : String(error)
    );
  }

  return null;
}

/**
 * Logs an error API request with format: [METHOD] path → ERROR status — code: message
 * If error details cannot be extracted, falls back to: [METHOD] path → ERROR status
 * Always logs regardless of LOG_API_REQUESTS environment variable.
 * @param {string} method HTTP method (GET, POST, etc.)
 * @param {string} path Request path
 * @param {number} status HTTP error status code (4xx or 5xx)
 * @param {Context} context Hono context for response body extraction
 * @returns {Promise<void>}
 */
async function logErrorRequest(method: string, path: string, status: number, context: Context): Promise<void> {
  const errorDetails = await extractErrorDetails(context);

  if (errorDetails) {
    // eslint-disable-next-line no-console
    console.log(`[${method}] ${path} → ERROR ${status} — ${errorDetails.code}: ${errorDetails.message}`);
  } else {
    // Fallback if error structure is different or unparseable
    // eslint-disable-next-line no-console
    console.log(`[${method}] ${path} → ERROR ${status}`);
  }
}

type HonoAppDependencies = {
  appController: AppController;
  todoController: TodoController;
  authUsecase: AuthUsecase;
  userRepository: UserRepository;
};

/**
 * Creates the Hono application and binds thin HTTP handlers to controllers.
 * @param {HonoAppDependencies} dependencies Object containing controllers and use cases
 * @returns {Hono} Configured Hono application instance
 */
export function createHonoApp(dependencies: HonoAppDependencies): Hono<AppEnv> {
  const { authUsecase, userRepository } = dependencies;
  const app = new Hono<AppEnv>();

  async function authMiddleware(
    c: Context<AppEnv>,
    next: Next,
  ): Promise<Response | void> {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json(
        {
          success: false,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        401,
      );
    }

    const token = authHeader.slice(7);
    const user = await userRepository.findByToken(token);
    if (!user) {
      return c.json(
        {
          success: false,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
        },
        401,
      );
    }

    c.set('userId', user.id);
    await next();
  }

  app.use(
    '*',
    cors({
      origin: process.env.CORS_ORIGIN ?? '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.onError((err, c) => {
    // eslint-disable-next-line no-console
    console.error('[unhandled error]', err);
    return c.json({ data: null, success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
  });

  app.use('*', async (c, next) => {
    const startTime = Date.now();
    await next();

    const path = c.req.path;
    const method = c.req.method;
    const status = c.res.status;
    const elapsedTimeMs = Date.now() - startTime;

    // Only log API routes (not /, /doc, etc)
    if (!shouldLogPath(path)) {
      return;
    }

    // Log based on response status
    if (isSuccessStatus(status)) {
      logSuccessRequest(method, path, status, elapsedTimeMs);
    } else if (isErrorStatus(status)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await logErrorRequest(method, path, status, c);
    }
  });

  app.get('/', c => c.text('Hello Hono!'));

  app.post('/api/v1/auth/signup', async c => {
    const parsed = parseAuthCredentials(await readRequestBody(c));

    if (!parsed.success) {
      return c.json(buildValidationErrorBody(parsed.message), 422);
    }

    try {
      const output = await authUsecase.signup({ email: parsed.email, password: parsed.password });
      return c.json(
        {
          success: true,
          data: {
            token: output.token,
            user: { id: output.id, email: output.email },
          },
        },
        201,
      );
    } catch (err) {
      if (isAppError(err) && err.code === 'CONFLICT') {
        return c.json(
          {
            success: false,
            data: null,
            error: { code: 'EMAIL_ALREADY_EXISTS', message: err.message },
          },
          409,
        );
      }
      // eslint-disable-next-line no-console
      console.error('[signup] unexpected error:', err);
      return c.json(
        { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        500,
      );
    }
  });

  app.post('/api/v1/auth/login', async c => {
    const parsed = parseAuthCredentials(await readRequestBody(c));

    if (!parsed.success) {
      return c.json(buildValidationErrorBody(parsed.message), 422);
    }

    try {
      const output = await authUsecase.login({ email: parsed.email, password: parsed.password });
      return c.json(
        {
          success: true,
          data: {
            token: output.token,
            user: { id: output.id, email: output.email },
          },
        },
        200,
      );
    } catch (err) {
      if (isAppError(err) && err.code === 'UNAUTHORIZED') {
        return c.json(
          {
            success: false,
            data: null,
            error: { code: 'INVALID_CREDENTIALS', message: err.message },
          },
          401,
        );
      }
      // eslint-disable-next-line no-console
      console.error('[login] unexpected error:', err);
      return c.json(
        { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        500,
      );
    }
  });

  app.put('/api/v1/users/:userId', async c => {
    const parsed = parseUpdateUserProfileInput(await readRequestBody(c));
    const userId = c.req.param('userId');

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: parsed.message },
        },
        422,
      );
    }

    return c.json(
      {
        success: true,
        data: { id: userId, email: parsed.email },
      },
      200,
    );
  });

  app.post(
    '/api/v1/apps',
    authMiddleware,
    describeRoute({
      description: 'Create a new App.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 100 },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'App created successfully.',
          content: {
            'application/json': { schema: resolver(AppSuccessSchema) },
          },
        },
        401: errorResponses[401],
        409: errorResponses[409],
        422: errorResponses[422],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.appController.create(
          await readRequestBody(c),
          c.get('userId'),
        ),
      ),
  );

  app.get(
    '/api/v1/apps',
    authMiddleware,
    describeRoute({
      description: 'List all active Apps.',
      responses: {
        200: {
          description: 'List of Apps retrieved successfully.',
          content: {
            'application/json': { schema: resolver(AppListSuccessSchema) },
          },
        },
        401: errorResponses[401],
        500: errorResponses[500],
      },
    }),
    async c => toJsonResponse(c, await dependencies.appController.list(c.get('userId'))),
  );

  app.get(
    '/api/v1/apps/:appId',
    authMiddleware,
    describeRoute({
      description: 'Get an App by ID.',
      responses: {
        200: {
          description: 'App retrieved successfully.',
          content: {
            'application/json': { schema: resolver(AppSuccessSchema) },
          },
        },
        401: errorResponses[401],
        403: errorResponses[403],
        404: errorResponses[404],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.appController.get(c.req.param('appId'), c.get('userId')),
      ),
  );

  app.put(
    '/api/v1/apps/:appId',
    authMiddleware,
    describeRoute({
      description: 'Partially update an App.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 100 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'App updated successfully.',
          content: {
            'application/json': { schema: resolver(AppSuccessSchema) },
          },
        },
        401: errorResponses[401],
        403: errorResponses[403],
        404: errorResponses[404],
        409: errorResponses[409],
        422: errorResponses[422],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.appController.update(
          c.req.param('appId'),
          await readRequestBody(c),
          c.get('userId'),
        ),
      ),
  );

  app.delete(
    '/api/v1/apps/:appId',
    authMiddleware,
    describeRoute({
      description: 'Soft-delete an App and cascade to its Todos.',
      responses: {
        200: {
          description: 'App deleted successfully.',
          content: {
            'application/json': { schema: resolver(AppSuccessSchema) },
          },
        },
        401: errorResponses[401],
        403: errorResponses[403],
        404: errorResponses[404],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.appController.delete(c.req.param('appId'), c.get('userId')),
      ),
  );

  app.post(
    '/api/v1/apps/:appId/todos',
    authMiddleware,
    describeRoute({
      description: 'Create a new Todo in an App.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title'],
              properties: {
                title: { type: 'string', minLength: 1, maxLength: 200 },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Todo created successfully.',
          content: {
            'application/json': { schema: resolver(TodoSuccessSchema) },
          },
        },
        401: errorResponses[401],
        403: errorResponses[403],
        404: errorResponses[404],
        422: errorResponses[422],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.todoController.create(
          c.req.param('appId'),
          await readRequestBody(c),
          c.get('userId'),
        ),
      ),
  );

  app.get(
    '/api/v1/apps/:appId/todos',
    authMiddleware,
    describeRoute({
      description: 'List all active Todos for an App.',
      responses: {
        200: {
          description: 'List of Todos retrieved successfully.',
          content: {
            'application/json': { schema: resolver(TodoListSuccessSchema) },
          },
        },
        401: errorResponses[401],
        403: errorResponses[403],
        404: errorResponses[404],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.todoController.list(c.req.param('appId'), c.get('userId')),
      ),
  );

  app.get(
    '/api/v1/apps/:appId/todos/:todoId',
    authMiddleware,
    describeRoute({
      description: 'Get a Todo by ID.',
      responses: {
        200: {
          description: 'Todo retrieved successfully.',
          content: {
            'application/json': { schema: resolver(TodoSuccessSchema) },
          },
        },
        401: errorResponses[401],
        403: errorResponses[403],
        404: errorResponses[404],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.todoController.get(
          c.req.param('appId'),
          c.req.param('todoId'),
          c.get('userId'),
        ),
      ),
  );

  app.put(
    '/api/v1/apps/:appId/todos/:todoId',
    authMiddleware,
    describeRoute({
      description: 'Partially update a Todo.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string', minLength: 1, maxLength: 200 },
                completed: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Todo updated successfully.',
          content: {
            'application/json': { schema: resolver(TodoSuccessSchema) },
          },
        },
        401: errorResponses[401],
        403: errorResponses[403],
        404: errorResponses[404],
        422: errorResponses[422],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.todoController.update(
          c.req.param('appId'),
          c.req.param('todoId'),
          await readRequestBody(c),
          c.get('userId'),
        ),
      ),
  );

  app.delete(
    '/api/v1/apps/:appId/todos/:todoId',
    authMiddleware,
    describeRoute({
      description: 'Soft-delete a Todo.',
      responses: {
        200: {
          description: 'Todo deleted successfully.',
          content: {
            'application/json': { schema: resolver(TodoSuccessSchema) },
          },
        },
        401: errorResponses[401],
        403: errorResponses[403],
        404: errorResponses[404],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.todoController.delete(
          c.req.param('appId'),
          c.req.param('todoId'),
          c.get('userId'),
        ),
      ),
  );

  app.get(
    '/doc',
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: 'TDD Todo App API',
          version: '1.0.0',
          description: 'REST API for TDD Todo Application',
        },
        servers: [{ url: '/', description: 'API root' }],
      },
    }),
  );

  return app;
}

/**
 * Reads the request body and parses it as JSON.
 * @param {Context} context Hono context
 * @returns {Promise<unknown>} Parsed JSON object or empty object if parsing fails
 */
async function readRequestBody(context: Context): Promise<unknown> {
  try {
    return await context.req.json();
  } catch {
    return {};
  }
}

/**
 * Converts a JsonHttpResponse to a Hono response with appropriate status code.
 * @param {Context} context Hono context
 * @param {JsonHttpResponse} response The HTTP response object to convert
 * @returns {Response} Hono JSON response
 */
function toJsonResponse(context: Context, response: JsonHttpResponse) {
  // status values are produced by http-presenter which only emits valid HTTP codes
  return context.json(response.body, response.status as ContentfulStatusCode);
}

/**
 * Builds a validation error response body.
 * @param {string} message Error message
 * @returns {object} Validation error response object
 */
function buildValidationErrorBody(message: string) {
  return { data: null, success: false, error: { code: 'VALIDATION_ERROR', message } } as const;
}

/**
 * Parses and validates authentication credentials from request body.
 * Validates email format and password length.
 * @param {unknown} body Request body to parse
 * @returns {object} Parsed credentials with success flag or error message
 */
function parseAuthCredentials(body: unknown):
  | { success: true; email: string; password: string }
  | { success: false; message: string } {
  if (typeof body !== 'object' || body === null) {
    return { success: false, message: 'Email and password are required.' };
  }

  const { email, password } = body as {
    email?: unknown;
    password?: unknown;
  };

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { success: false, message: 'Email and password are required.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalizedEmail)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  if (password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters.' };
  }

  return { success: true, email: normalizedEmail, password };
}
