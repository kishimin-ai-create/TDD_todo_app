import { describe, it, expect } from 'vitest';

import { createHonoApp } from '../../../infrastructure/hono-app';
import { createAppController } from '../../../controllers/app-controller';
import { createAuthController } from '../../../controllers/auth-controller';
import { createTodoController } from '../../../controllers/todo-controller';
import { createAppInteractor } from '../../../services/app-interactor';
import { createAuthInteractor } from '../../../services/auth-interactor';
import { createTodoInteractor } from '../../../services/todo-interactor';
import { createInMemoryAppRepository, createInMemoryTodoRepository, createInMemoryUserRepository } from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';

function buildApp() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const userRepository = createInMemoryUserRepository(storage);
  const appUsecase = createAppInteractor({ appRepository, todoRepository });
  const todoUsecase = createTodoInteractor({ appRepository, todoRepository });
  const authUsecase = createAuthInteractor({ userRepository });
  const appController = createAppController(appUsecase);
  const todoController = createTodoController(todoUsecase);
  const authController = createAuthController(authUsecase);
  return {
    app: createHonoApp({ appController, todoController, authController }),
    clearStorage: () => storage.clear(),
  };
}

function req(app: ReturnType<typeof buildApp>['app'], method: string, path: string, body?: unknown) {
  return app.request(`http://localhost${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe('HonoApp integration', () => {
  describe('root route', () => {
    it('GET / returns 200 with text response', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/');
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('Hono');
    });
  });

  describe('unknown routes', () => {
    it('GET /unknown returns 404', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/unknown');
      expect(res.status).toBe(404);
    });

    it('GET /api/v1/unknown returns 404', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/api/v1/unknown');
      expect(res.status).toBe(404);
    });

    it('POST /api/v1/unknown returns 404', async () => {
      const { app } = buildApp();
      const res = await req(app, 'POST', '/api/v1/unknown', {});
      expect(res.status).toBe(404);
    });
  });

  describe('Content-Type header', () => {
    it('GET /api/v1/apps returns application/json Content-Type', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/api/v1/apps');
      expect(res.headers.get('content-type')).toMatch(/application\/json/);
    });

    it('POST /api/v1/apps returns application/json Content-Type on success', async () => {
      const { app } = buildApp();
      const res = await req(app, 'POST', '/api/v1/apps', { name: 'Test' });
      expect(res.headers.get('content-type')).toMatch(/application\/json/);
    });

    it('POST /api/v1/apps returns application/json Content-Type on error', async () => {
      const { app } = buildApp();
      const res = await req(app, 'POST', '/api/v1/apps', {});
      expect(res.headers.get('content-type')).toMatch(/application\/json/);
    });
  });

  describe('malformed body handling', () => {
    it('POST with non-JSON body falls back to empty body (returns 422)', async () => {
      const { app } = buildApp();
      const res = await app.request('http://localhost/api/v1/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      });
      expect(res.status).toBe(422);
    });

    it('PUT with no body is accepted as no-op update (200)', async () => {
      const { app } = buildApp();
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'App' });
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await app.request(`http://localhost/api/v1/apps/${data.id}`, {
        method: 'PUT',
      });
      expect(res.status).toBe(200);
    });
  });

  describe('all app routes are wired', () => {
    it('POST /api/v1/apps creates an app (201)', async () => {
      const { app } = buildApp();
      const res = await req(app, 'POST', '/api/v1/apps', { name: 'A' });
      expect(res.status).toBe(201);
    });

    it('GET /api/v1/apps lists apps (200)', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/api/v1/apps');
      expect(res.status).toBe(200);
    });

    it('GET /api/v1/apps/:id gets app (200)', async () => {
      const { app } = buildApp();
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'B' });
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await req(app, 'GET', `/api/v1/apps/${data.id}`);
      expect(res.status).toBe(200);
    });

    it('PUT /api/v1/apps/:id updates app (200)', async () => {
      const { app } = buildApp();
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'C' });
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await req(app, 'PUT', `/api/v1/apps/${data.id}`, { name: 'D' });
      expect(res.status).toBe(200);
    });

    it('DELETE /api/v1/apps/:id deletes app (200)', async () => {
      const { app } = buildApp();
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'E' });
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await req(app, 'DELETE', `/api/v1/apps/${data.id}`);
      expect(res.status).toBe(200);
    });
  });

  describe('all todo routes are wired', () => {
    it('POST /api/v1/apps/:id/todos creates a todo (201)', async () => {
      const { app } = buildApp();
      const createAppRes = await req(app, 'POST', '/api/v1/apps', { name: 'App' });
      const { data: appData } = await createAppRes.json() as { data: { id: string } };
      const res = await req(app, 'POST', `/api/v1/apps/${appData.id}/todos`, { title: 'T' });
      expect(res.status).toBe(201);
    });

    it('GET /api/v1/apps/:id/todos lists todos (200)', async () => {
      const { app } = buildApp();
      const createAppRes = await req(app, 'POST', '/api/v1/apps', { name: 'App' });
      const { data: appData } = await createAppRes.json() as { data: { id: string } };
      const res = await req(app, 'GET', `/api/v1/apps/${appData.id}/todos`);
      expect(res.status).toBe(200);
    });
  });
});
