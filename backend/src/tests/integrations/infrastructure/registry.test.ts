import { describe, it, expect } from 'vitest';

import { createBackendRegistry } from '../../../infrastructure/registry';

const TEST_EMAIL = 'registry@example.com';
const TEST_PASSWORD = 'password123';

async function getToken(app: ReturnType<typeof createBackendRegistry>['app']): Promise<string> {
  const res = await app.request('http://localhost/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const json = await res.json() as { data: { token: string } };
  return json.data.token;
}

describe('Registry integration', () => {
  describe('createBackendRegistry', () => {
    it('returns an object with app and clearStorage', () => {
      const registry = createBackendRegistry();
      expect(typeof registry.app).toBe('object');
      expect(typeof registry.clearStorage).toBe('function');
    });

    it('app is a Hono-compatible handler (has request method)', () => {
      const { app } = createBackendRegistry();
      expect(typeof app.request).toBe('function');
    });

    it('app responds to GET /', async () => {
      const { app } = createBackendRegistry();
      const res = await app.request('http://localhost/');
      expect(res.status).toBe(200);
    });

    it('app responds to GET /api/v1/apps with 401 when no token provided', async () => {
      const { app } = createBackendRegistry();
      const res = await app.request('http://localhost/api/v1/apps');
      expect(res.status).toBe(401);
    });

    it('app responds to GET /api/v1/apps with 200 when token provided', async () => {
      const { app } = createBackendRegistry();
      const token = await getToken(app);
      const res = await app.request('http://localhost/api/v1/apps', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
    });

    it('clearStorage() empties persisted data', async () => {
      const { app, clearStorage } = createBackendRegistry();
      const token = await getToken(app);
      await app.request('http://localhost/api/v1/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: 'App' }),
      });
      let res = await app.request('http://localhost/api/v1/apps', {
        headers: { Authorization: `Bearer ${token}` },
      });
      let json = await res.json() as { data: unknown[] };
      expect(json.data.length).toBe(1);
      clearStorage();
      // After clearing storage the JWT is also invalidated (user no longer exists),
      // but the token structure is still valid — we only test that the list is empty.
      // Get a fresh token after clearing.
      const token2 = await getToken(app);
      res = await app.request('http://localhost/api/v1/apps', {
        headers: { Authorization: `Bearer ${token2}` },
      });
      json = await res.json() as { data: unknown[] };
      expect(json.data.length).toBe(0);
    });

    it('each call to createBackendRegistry creates an isolated registry', async () => {
      const r1 = createBackendRegistry();
      const r2 = createBackendRegistry();
      const t1 = await getToken(r1.app);
      await r1.app.request('http://localhost/api/v1/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t1}` },
        body: JSON.stringify({ name: 'R1 App' }),
      });
      const t2 = await getToken(r2.app);
      const res = await r2.app.request('http://localhost/api/v1/apps', {
        headers: { Authorization: `Bearer ${t2}` },
      });
      const json = await res.json() as { data: unknown[] };
      expect(json.data.length).toBe(0);
    });
  });
});
