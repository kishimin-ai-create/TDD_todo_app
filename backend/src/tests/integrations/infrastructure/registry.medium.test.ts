import { describe, it, expect } from 'vitest';

import { createBackendRegistry } from '../../../infrastructure/registry';

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

    it('app responds to GET /api/v1/apps with 200', async () => {
      const { app } = createBackendRegistry();
      const res = await app.request('http://localhost/api/v1/apps');
      expect(res.status).toBe(200);
    });

    it('clearStorage() empties persisted data', async () => {
      const { app, clearStorage } = createBackendRegistry();
      await app.request('http://localhost/api/v1/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'App' }),
      });
      let res = await app.request('http://localhost/api/v1/apps');
      let json = await res.json() as { data: unknown[] };
      expect(json.data.length).toBe(1);
      clearStorage();
      res = await app.request('http://localhost/api/v1/apps');
      json = await res.json() as { data: unknown[] };
      expect(json.data.length).toBe(0);
    });

    it('each call to createBackendRegistry creates an isolated registry', async () => {
      const r1 = createBackendRegistry();
      const r2 = createBackendRegistry();
      await r1.app.request('http://localhost/api/v1/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'R1 App' }),
      });
      const res = await r2.app.request('http://localhost/api/v1/apps');
      const json = await res.json() as { data: unknown[] };
      expect(json.data.length).toBe(0);
    });
  });
});
