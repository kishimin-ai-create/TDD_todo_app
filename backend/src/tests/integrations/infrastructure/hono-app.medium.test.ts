import { beforeEach, describe, expect, it } from 'vitest';

import { createHonoApp } from '../../../infrastructure/hono-app';
import { createAppController } from '../../../controllers/app-controller';
import { createTodoController } from '../../../controllers/todo-controller';
import { createAppInteractor } from '../../../services/app-interactor';
import { createTodoInteractor } from '../../../services/todo-interactor';
import { createAuthInteractor } from '../../../services/auth-interactor';
import { createInMemoryAppRepository, createInMemoryTodoRepository, createInMemoryUserRepository } from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';

function buildApp() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const userRepository = createInMemoryUserRepository();
  const appUsecase = createAppInteractor({ appRepository, todoRepository });
  const todoUsecase = createTodoInteractor({ appRepository, todoRepository });
  const authUsecase = createAuthInteractor({ userRepository });
  const appController = createAppController(appUsecase);
  const todoController = createTodoController(todoUsecase);
  return createHonoApp({ appController, todoController, authUsecase, userRepository });
}

async function createSession(app: ReturnType<typeof buildApp>, email = `user-${crypto.randomUUID()}@example.com`) {
  const res = await app.request('http://localhost/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  const json = await res.json() as { data: { token: string; user: { id: string } } };
  return json.data;
}

function authHeaders(token: string, hasBody = false): HeadersInit {
  return hasBody
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { Authorization: `Bearer ${token}` };
}

describe('HonoApp integration', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  it('GET / returns 200 with text response', async () => {
    const res = await app.request('http://localhost/');
    expect(res.status).toBe(200);
  });

  it('rejects protected routes without auth', async () => {
    const res = await app.request('http://localhost/api/v1/apps');
    expect(res.status).toBe(401);
  });

  it('rejects invalid bearer tokens', async () => {
    const res = await app.request('http://localhost/api/v1/apps', {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    expect(res.status).toBe(401);
  });

  it('allows authenticated app CRUD for the owner', async () => {
    const session = await createSession(app);
    const createRes = await app.request('http://localhost/api/v1/apps', {
      method: 'POST',
      headers: authHeaders(session.token, true),
      body: JSON.stringify({ name: 'Owned App' }),
    });
    expect(createRes.status).toBe(201);
    const createJson = await createRes.json() as { data: { id: string } };

    const listRes = await app.request('http://localhost/api/v1/apps', {
      headers: authHeaders(session.token),
    });
    expect(listRes.status).toBe(200);

    const getRes = await app.request(`http://localhost/api/v1/apps/${createJson.data.id}`, {
      headers: authHeaders(session.token),
    });
    expect(getRes.status).toBe(200);
  });

  it('returns 403 for another user app access', async () => {
    const owner = await createSession(app, 'owner@example.com');
    const other = await createSession(app, 'other@example.com');
    const createRes = await app.request('http://localhost/api/v1/apps', {
      method: 'POST',
      headers: authHeaders(owner.token, true),
      body: JSON.stringify({ name: 'Owned App' }),
    });
    const createJson = await createRes.json() as { data: { id: string } };

    const res = await app.request(`http://localhost/api/v1/apps/${createJson.data.id}`, {
      headers: authHeaders(other.token),
    });
    expect(res.status).toBe(403);
  });

  it('returns 403 for another user app todo access', async () => {
    const owner = await createSession(app, 'owner2@example.com');
    const other = await createSession(app, 'other2@example.com');
    const createAppRes = await app.request('http://localhost/api/v1/apps', {
      method: 'POST',
      headers: authHeaders(owner.token, true),
      body: JSON.stringify({ name: 'Owned App' }),
    });
    const appJson = await createAppRes.json() as { data: { id: string } };

    const res = await app.request(`http://localhost/api/v1/apps/${appJson.data.id}/todos`, {
      method: 'POST',
      headers: authHeaders(other.token, true),
      body: JSON.stringify({ title: 'Blocked' }),
    });
    expect(res.status).toBe(403);
  });
});
