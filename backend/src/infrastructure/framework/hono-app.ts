import { Hono, type Context } from 'hono';
import type { AppController } from '../../interface/controllers/app-controller';
import type { TodoController } from '../../interface/controllers/todo-controller';
import type { JsonHttpResponse } from '../../interface/presenters/http-presenter';

type HonoAppDependencies = {
  appController: AppController;
  todoController: TodoController;
};

/**
 * Creates the Hono application and binds thin HTTP handlers to controllers.
 */
export function createHonoApp(dependencies: HonoAppDependencies) {
  const app = new Hono();

  app.get('/', c => c.text('Hello Hono!'));

  app.post('/api/v1/apps', async c =>
    toJsonResponse(
      c,
      await dependencies.appController.create(await readRequestBody(c)),
    ),
  );

  app.get('/api/v1/apps', async c =>
    toJsonResponse(c, await dependencies.appController.list()),
  );

  app.get('/api/v1/apps/:appId', async c =>
    toJsonResponse(
      c,
      await dependencies.appController.get(c.req.param('appId')),
    ),
  );

  app.put('/api/v1/apps/:appId', async c =>
    toJsonResponse(
      c,
      await dependencies.appController.update(
        c.req.param('appId'),
        await readRequestBody(c),
      ),
    ),
  );

  app.delete('/api/v1/apps/:appId', async c =>
    toJsonResponse(
      c,
      await dependencies.appController.delete(c.req.param('appId')),
    ),
  );

  app.post('/api/v1/apps/:appId/todos', async c =>
    toJsonResponse(
      c,
      await dependencies.todoController.create(
        c.req.param('appId'),
        await readRequestBody(c),
      ),
    ),
  );

  app.get('/api/v1/apps/:appId/todos', async c =>
    toJsonResponse(
      c,
      await dependencies.todoController.list(c.req.param('appId')),
    ),
  );

  app.get('/api/v1/apps/:appId/todos/:todoId', async c =>
    toJsonResponse(
      c,
      await dependencies.todoController.get(
        c.req.param('appId'),
        c.req.param('todoId'),
      ),
    ),
  );

  app.put('/api/v1/apps/:appId/todos/:todoId', async c =>
    toJsonResponse(
      c,
      await dependencies.todoController.update(
        c.req.param('appId'),
        c.req.param('todoId'),
        await readRequestBody(c),
      ),
    ),
  );

  app.delete('/api/v1/apps/:appId/todos/:todoId', async c =>
    toJsonResponse(
      c,
      await dependencies.todoController.delete(
        c.req.param('appId'),
        c.req.param('todoId'),
      ),
    ),
  );

  return app;
}

async function readRequestBody(
  context: Context,
): Promise<unknown> {
  try {
    return await context.req.json();
  } catch {
    return {};
  }
}

function toJsonResponse(
  context: Context,
  response: JsonHttpResponse,
) {
  return context.json(response.body, response.status);
}
