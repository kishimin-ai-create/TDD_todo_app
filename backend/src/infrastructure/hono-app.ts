import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { describeRoute, openAPIRouteHandler, resolver } from 'hono-openapi';
import type { AppController } from '../controllers/app-controller';
import type { TodoController } from '../controllers/todo-controller';
import type { AuthController } from '../controllers/auth-controller';
import type { JsonHttpResponse } from '../controllers/http-presenter';
import {
  AppDtoSchema,
  AuthDtoSchema,
  ErrorResponseSchema,
  SuccessResponseSchema,
  TodoDtoSchema,
} from '../controllers/schemas';
import { z } from 'zod';

const AppSuccessSchema = SuccessResponseSchema(AppDtoSchema);
const AppListSuccessSchema = SuccessResponseSchema(z.array(AppDtoSchema));
const TodoSuccessSchema = SuccessResponseSchema(TodoDtoSchema);
const TodoListSuccessSchema = SuccessResponseSchema(z.array(TodoDtoSchema));
const AuthSuccessSchema = SuccessResponseSchema(AuthDtoSchema);

const errorResponses = {
  401: {
    description: 'Unauthorized — missing or invalid token.',
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

type JwtPayload = {
  sub: string;
  email: string;
  exp: number;
};

type HonoAppDependencies = {
  appController: AppController;
  todoController: TodoController;
  authController: AuthController;
  jwtSecret: string;
};

/**
 * Creates the Hono application and binds thin HTTP handlers to controllers.
 */
export function createHonoApp(dependencies: HonoAppDependencies): Hono {
  const app = new Hono();
  const jwtSecret = dependencies.jwtSecret;

  app.use(
    '*',
    cors({
      origin: process.env.CORS_ORIGIN ?? '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // eslint-disable-next-line no-console
  app.onError((err, c) => {
    console.error('[unhandled error]', err);
    return c.json({ data: null, success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
  });

  app.get('/', c => c.text('Hello Hono!'));

  // ─── Auth routes (public) ──────────────────────────────────────────────────

  app.post(
    '/api/v1/auth/register',
    describeRoute({
      description: 'Register a new user.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8, maxLength: 72 },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User registered successfully.',
          content: { 'application/json': { schema: resolver(AuthSuccessSchema) } },
        },
        409: errorResponses[409],
        422: errorResponses[422],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.authController.register(await readRequestBody(c)),
      ),
  );

  app.post(
    '/api/v1/auth/login',
    describeRoute({
      description: 'Login and receive a JWT token.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful.',
          content: { 'application/json': { schema: resolver(AuthSuccessSchema) } },
        },
        401: errorResponses[401],
        422: errorResponses[422],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.authController.login(await readRequestBody(c)),
      ),
  );

  // ─── JWT middleware for all /api/v1/apps* routes ───────────────────────────

  app.use('/api/v1/apps/*', async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        { data: null, success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } },
        401,
      );
    }
    const token = authHeader.slice(7);
    try {
      const payload = await verify(token, jwtSecret, 'HS256') as JwtPayload;
      c.set('jwtPayload', payload);
      await next();
    } catch {
      return c.json(
        { data: null, success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
        401,
      );
    }
  });

  // ─── App routes (protected) ────────────────────────────────────────────────

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
          getUserId(c),
        ),
      ),
  );

  app.get(
    '/api/v1/apps',
    describeRoute({
      description: 'List all active Apps for the authenticated user.',
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
    async c => toJsonResponse(c, await dependencies.appController.list(getUserId(c))),
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
        401: errorResponses[401],
        404: errorResponses[404],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.appController.get(c.req.param('appId'), getUserId(c)),
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
        401: errorResponses[401],
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
          getUserId(c),
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
        401: errorResponses[401],
        404: errorResponses[404],
        500: errorResponses[500],
      },
    }),
    async c =>
      toJsonResponse(
        c,
        await dependencies.appController.delete(c.req.param('appId'), getUserId(c)),
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
        401: errorResponses[401],
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
        401: errorResponses[401],
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
        401: errorResponses[401],
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
        401: errorResponses[401],
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
        401: errorResponses[401],
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

/**
 * Creates a JWT sign function bound to the given secret.
 */
export function createJwtSigner(
  secret: string,
): (userId: string, email: string) => Promise<string> {
  return async (userId: string, email: string): Promise<string> => {
    const payload = {
      sub: userId,
      email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    };
    return sign(payload, secret, 'HS256');
  };
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

function getUserId(context: Context): string {
  const payload = context.get('jwtPayload') as JwtPayload;
  return payload.sub;
}
