import { describe, it, expect } from 'vitest';

import { createHonoApp, createJwtSigner } from '../../../infrastructure/hono-app';
import { createAppController } from '../../../controllers/app-controller';
import { createTodoController } from '../../../controllers/todo-controller';
import { createAuthController } from '../../../controllers/auth-controller';
import { createAppInteractor } from '../../../services/app-interactor';
import { createTodoInteractor } from '../../../services/todo-interactor';
import { createAuthInteractor } from '../../../services/auth-interactor';
import { createInMemoryAppRepository, createInMemoryTodoRepository } from '../../../infrastructure/in-memory-repositories';
import { createInMemoryUserRepository } from '../../../infrastructure/in-memory-user-repository';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';

const TEST_SECRET = 'test-jwt-secret';

function buildApp() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const userRepository = createInMemoryUserRepository(storage);
  const signToken = createJwtSigner(TEST_SECRET);
  const appUsecase = createAppInteractor({ appRepository, todoRepository });
  const todoUsecase = createTodoInteractor({ appRepository, todoRepository });
  const authUsecase = createAuthInteractor({ userRepository, signToken });
  const appController = createAppController(appUsecase);
  const todoController = createTodoController(todoUsecase);
  const authController = createAuthController(authUsecase);
  return {
    app: createHonoApp({ appController, todoController, authController, jwtSecret: TEST_SECRET }),
    clearStorage: () => storage.clear(),
  };
}

function req(app: ReturnType<typeof buildApp>['app'], method: string, path: string, body?: unknown, token?: string) {
  return app.request(`http://localhost${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function getToken(app: ReturnType<typeof buildApp>['app'], email = 'test@example.com', password = 'password123') {
  const res = await req(app, 'POST', '/api/v1/auth/register', { email, password });
  const json = await res.json() as { data: { token: string } };
  return json.data.token;
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

  describe('auth routes', () => {
    it('POST /api/v1/auth/register returns 201 with token', async () => {
      const { app } = buildApp();
      const res = await req(app, 'POST', '/api/v1/auth/register', { email: 'a@b.com', password: 'password123' });
      expect(res.status).toBe(201);
      const json = await res.json() as { data: { token: string; user: { email: string } }; success: boolean };
      expect(json.success).toBe(true);
      expect(typeof json.data.token).toBe('string');
      expect(json.data.user.email).toBe('a@b.com');
    });

    it('POST /api/v1/auth/login returns 200 with token', async () => {
      const { app } = buildApp();
      await req(app, 'POST', '/api/v1/auth/register', { email: 'a@b.com', password: 'password123' });
      const res = await req(app, 'POST', '/api/v1/auth/login', { email: 'a@b.com', password: 'password123' });
      expect(res.status).toBe(200);
      const json = await res.json() as { data: { token: string }; success: boolean };
      expect(json.success).toBe(true);
      expect(typeof json.data.token).toBe('string');
    });

    it('POST /api/v1/auth/login returns 401 for wrong password', async () => {
      const { app } = buildApp();
      await req(app, 'POST', '/api/v1/auth/register', { email: 'a@b.com', password: 'password123' });
      const res = await req(app, 'POST', '/api/v1/auth/login', { email: 'a@b.com', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });
  });

  describe('Content-Type header', () => {
    it('GET /api/v1/apps returns 401 without token', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/api/v1/apps');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/apps returns application/json Content-Type with token', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const res = await req(app, 'GET', '/api/v1/apps', undefined, token);
      expect(res.headers.get('content-type')).toMatch(/application\/json/);
    });

    it('POST /api/v1/apps returns application/json Content-Type on success', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const res = await req(app, 'POST', '/api/v1/apps', { name: 'Test' }, token);
      expect(res.headers.get('content-type')).toMatch(/application\/json/);
    });

    it('POST /api/v1/apps returns application/json Content-Type on error', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const res = await req(app, 'POST', '/api/v1/apps', {}, token);
      expect(res.headers.get('content-type')).toMatch(/application\/json/);
    });
  });

  describe('malformed body handling', () => {
    it('POST with non-JSON body falls back to empty body (returns 422)', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const res = await app.request('http://localhost/api/v1/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: 'not-json',
      });
      expect(res.status).toBe(422);
    });

    it('PUT with no body is accepted as no-op update (200)', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'App' }, token);
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await app.request(`http://localhost/api/v1/apps/${data.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('all app routes are wired', () => {
    it('POST /api/v1/apps creates an app (201)', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const res = await req(app, 'POST', '/api/v1/apps', { name: 'A' }, token);
      expect(res.status).toBe(201);
    });

    it('GET /api/v1/apps lists apps (200)', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const res = await req(app, 'GET', '/api/v1/apps', undefined, token);
      expect(res.status).toBe(200);
    });

    it('GET /api/v1/apps/:id gets app (200)', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'B' }, token);
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await req(app, 'GET', `/api/v1/apps/${data.id}`, undefined, token);
      expect(res.status).toBe(200);
    });

    it('PUT /api/v1/apps/:id updates app (200)', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'C' }, token);
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await req(app, 'PUT', `/api/v1/apps/${data.id}`, { name: 'D' }, token);
      expect(res.status).toBe(200);
    });

    it('DELETE /api/v1/apps/:id deletes app (200)', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'E' }, token);
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await req(app, 'DELETE', `/api/v1/apps/${data.id}`, undefined, token);
      expect(res.status).toBe(200);
    });
  });

  describe('all todo routes are wired', () => {
    it('POST /api/v1/apps/:id/todos creates a todo (201)', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const createAppRes = await req(app, 'POST', '/api/v1/apps', { name: 'App' }, token);
      const { data: appData } = await createAppRes.json() as { data: { id: string } };
      const res = await req(app, 'POST', `/api/v1/apps/${appData.id}/todos`, { title: 'T' }, token);
      expect(res.status).toBe(201);
    });

    it('GET /api/v1/apps/:id/todos lists todos (200)', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const createAppRes = await req(app, 'POST', '/api/v1/apps', { name: 'App' }, token);
      const { data: appData } = await createAppRes.json() as { data: { id: string } };
      const res = await req(app, 'GET', `/api/v1/apps/${appData.id}/todos`, undefined, token);
      expect(res.status).toBe(200);
    });
  });

  describe('JWT protection', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/api/v1/apps');
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/api/v1/apps', undefined, 'invalid.token.here');
      expect(res.status).toBe(401);
    });

    it('returns 200 when a valid token is provided', async () => {
      const { app } = buildApp();
      const token = await getToken(app);
      const res = await req(app, 'GET', '/api/v1/apps', undefined, token);
      expect(res.status).toBe(200);
    });
  });
});
