import { describe, it, expect } from 'vitest';

import { createBackendRegistry } from '../../../infrastructure/registry';

async function createSession(app: ReturnType<typeof createBackendRegistry>['app'], email = 'user@example.com') {
  const res = await app.request('http://localhost/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  const json = await res.json() as { data: { token: string } };
  return json.data.token;
}

describe('Registry integration', () => {
  it('returns an object with app and clearStorage', () => {
    const registry = createBackendRegistry();
    expect(typeof registry.app).toBe('object');
    expect(typeof registry.clearStorage).toBe('function');
  });

  it('app responds to GET /', async () => {
    const { app } = createBackendRegistry();
    const res = await app.request('http://localhost/');
    expect(res.status).toBe(200);
  });

  it('protected routes require auth', async () => {
    const { app } = createBackendRegistry();
    const res = await app.request('http://localhost/api/v1/apps');
    expect(res.status).toBe(401);
  });

  it('clearStorage() empties persisted app data and users', async () => {
    const { app, clearStorage } = createBackendRegistry();
    const token = await createSession(app);
    await app.request('http://localhost/api/v1/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'App' }),
    });
    let res = await app.request('http://localhost/api/v1/apps', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json() as { data: unknown[] };
    expect(json.data.length).toBe(1);
    clearStorage();
    res = await app.request('http://localhost/api/v1/apps', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });
});
