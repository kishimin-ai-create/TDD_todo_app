import { Hono, type Context } from 'hono';
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

const AppSuccessSchema = SuccessResponseSchema(AppDtoSchema);
const AppListSuccessSchema = SuccessResponseSchema(z.array(AppDtoSchema));
const TodoSuccessSchema = SuccessResponseSchema(TodoDtoSchema);
const TodoListSuccessSchema = SuccessResponseSchema(z.array(TodoDtoSchema));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorResponses = {
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

type HonoAppDependencies = {
  appController: AppController;
  todoController: TodoController;
  authUsecase: AuthUsecase;
};

/**
 * Creates the Hono application and binds thin HTTP handlers to controllers.
 */
export function createHonoApp(dependencies: HonoAppDependencies): Hono {
  const { authUsecase } = dependencies;
  const app = new Hono();

  app.use(
    '*',
    cors({
      origin: process.env.CORS_ORIGIN ?? '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
    }),
  );

  app.onError((err, c) => {
    // eslint-disable-next-line no-console
    console.error('[unhandled error]', err);
    return c.json({ data: null, success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
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
        409: errorResponses[409],
        422: errorResponses[422],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.appController.create(await readRequestBody(c)),
      ),
  );

  app.get(
    '/api/v1/apps',
    describeRoute({
      description: 'List all active Apps.',
      responses: {
        200: {
          description: 'List of Apps retrieved successfully.',
          content: {
            'application/json': { schema: resolver(AppListSuccessSchema) },
          },
        },
        500: errorResponses[500],
      },
    }),
    async c => toJsonResponse(c, await dependencies.appController.list()),
  );

  app.get(
    '/api/v1/apps/:appId',
    describeRoute({
      description: 'Get an App by ID.',
      responses: {
        200: {
          description: 'App retrieved successfully.',
          content: {
            'application/json': { schema: resolver(AppSuccessSchema) },
          },
        },
        404: errorResponses[404],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.appController.get(c.req.param('appId')),
      ),
  );

  app.put(
    '/api/v1/apps/:appId',
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
        ),
      ),
  );

  app.delete(
    '/api/v1/apps/:appId',
    describeRoute({
      description: 'Soft-delete an App and cascade to its Todos.',
      responses: {
        200: {
          description: 'App deleted successfully.',
          content: {
            'application/json': { schema: resolver(AppSuccessSchema) },
          },
        },
        404: errorResponses[404],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.appController.delete(c.req.param('appId')),
      ),
  );

  app.post(
    '/api/v1/apps/:appId/todos',
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
        ),
      ),
  );

  app.get(
    '/api/v1/apps/:appId/todos',
    describeRoute({
      description: 'List all active Todos for an App.',
      responses: {
        200: {
          description: 'List of Todos retrieved successfully.',
          content: {
            'application/json': { schema: resolver(TodoListSuccessSchema) },
          },
        },
        404: errorResponses[404],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.todoController.list(c.req.param('appId')),
      ),
  );

  app.get(
    '/api/v1/apps/:appId/todos/:todoId',
    describeRoute({
      description: 'Get a Todo by ID.',
      responses: {
        200: {
          description: 'Todo retrieved successfully.',
          content: {
            'application/json': { schema: resolver(TodoSuccessSchema) },
          },
        },
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
        ),
      ),
  );

  app.put(
    '/api/v1/apps/:appId/todos/:todoId',
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
        ),
      ),
  );

  app.delete(
    '/api/v1/apps/:appId/todos/:todoId',
    describeRoute({
      description: 'Soft-delete a Todo.',
      responses: {
        200: {
          description: 'Todo deleted successfully.',
          content: {
            'application/json': { schema: resolver(TodoSuccessSchema) },
          },
        },
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

async function readRequestBody(context: Context): Promise<unknown> {
  try {
    return await context.req.json();
  } catch {
    return {};
  }
}

function toJsonResponse(context: Context, response: JsonHttpResponse) {
  // status values are produced by http-presenter which only emits valid HTTP codes
  return context.json(response.body, response.status as ContentfulStatusCode);
}

function buildValidationErrorBody(message: string) {
  return { data: null, success: false, error: { code: 'VALIDATION_ERROR', message } } as const;
}

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
