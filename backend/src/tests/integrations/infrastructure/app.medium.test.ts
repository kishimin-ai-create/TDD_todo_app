import { describe, it, expect, beforeEach } from 'vitest';

import {
  clearStorage,
  GHOST_APP_ID,
  UUID_RE,
  ISO8601_RE,
  request,
  createApp,
  createTodo,
  createUserSession,
  type AuthSession,
} from '../helpers';

let session: AuthSession;

beforeEach(async () => {
  clearStorage();
  session = await createUserSession();
});

// ═════════════════════════════════════════════════════════════════════════════
// App Endpoints
// ═════════════════════════════════════════════════════════════════════════════

describe('App endpoints authentication', () => {
  it('401: POST /api/v1/apps without auth', async () => {
    const res = await request('POST', '/api/v1/apps', { name: 'My App' });
    expect(res.status).toBe(401);
  });

  it('401: GET /api/v1/apps without auth', async () => {
    const res = await request('GET', '/api/v1/apps');
    expect(res.status).toBe(401);
  });

  it('401: GET /api/v1/apps/:appId without auth', async () => {
    const created = await createApp('Private App', session.token);
    const res = await request('GET', `/api/v1/apps/${created.id}`);
    expect(res.status).toBe(401);
  });

  it('401: PUT /api/v1/apps/:appId without auth', async () => {
    const created = await createApp('Private App', session.token);
    const res = await request('PUT', `/api/v1/apps/${created.id}`, { name: 'Updated' });
    expect(res.status).toBe(401);
  });

  it('401: DELETE /api/v1/apps/:appId without auth', async () => {
    const created = await createApp('Private App', session.token);
    const res = await request('DELETE', `/api/v1/apps/${created.id}`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/apps', () => {
  it('201: creates an app with correct response shape', async () => {
    const res = await request('POST', '/api/v1/apps', { name: 'My App' }, session.token);

    expect(res.status).toBe(201);

    const json = await res.json() as { data: Record<string, unknown>; success: boolean };
    expect(json.success).toBe(true);
    expect(typeof json.data.id).toBe('string');
    expect(UUID_RE.test(json.data.id as string)).toBe(true);
    expect(json.data.name).toBe('My App');
    expect(typeof json.data.createdAt).toBe('string');
    expect(ISO8601_RE.test(json.data.createdAt as string)).toBe(true);
    expect(typeof json.data.updatedAt).toBe('string');
    expect(ISO8601_RE.test(json.data.updatedAt as string)).toBe(true);
    expect(json.data.deletedAt).toBeUndefined();
  });

  it('422: missing name field', async () => {
    const res = await request('POST', '/api/v1/apps', {}, session.token);

    expect(res.status).toBe(422);

    const json = await res.json() as { data: null; success: boolean; error: { code: string; message: string } };
    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
    expect(typeof json.error.code).toBe('string');
    expect(json.error.code.length).toBeGreaterThan(0);
    expect(typeof json.error.message).toBe('string');
  });

  it('422: empty string name', async () => {
    const res = await request('POST', '/api/v1/apps', { name: '' }, session.token);
    expect(res.status).toBe(422);
  });

  it('422: whitespace-only name', async () => {
    const res = await request('POST', '/api/v1/apps', { name: '   ' }, session.token);
    expect(res.status).toBe(422);
  });

  it('422: name exceeds 100 characters (101 chars)', async () => {
    const longName = 'a'.repeat(101);
    const res = await request('POST', '/api/v1/apps', { name: longName }, session.token);
    expect(res.status).toBe(422);
  });

  it('201: name at exactly 100 characters is accepted', async () => {
    const maxName = 'a'.repeat(100);
    const res = await request('POST', '/api/v1/apps', { name: maxName }, session.token);

    expect(res.status).toBe(201);

    const json = await res.json() as { data: { name: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.name).toBe(maxName);
  });

  it('409: duplicate app name for the same user', async () => {
    await request('POST', '/api/v1/apps', { name: 'Duplicate App' }, session.token);
    const res = await request('POST', '/api/v1/apps', { name: 'Duplicate App' }, session.token);

    expect(res.status).toBe(409);

    const json = await res.json() as { data: null; success: boolean; error: { code: string } };
    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
    expect(typeof json.error.code).toBe('string');
  });

  it('201: allows duplicate app names for different users', async () => {
    const other = await createUserSession('other@example.com');
    await request('POST', '/api/v1/apps', { name: 'Shared Name' }, session.token);
    const res = await request('POST', '/api/v1/apps', { name: 'Shared Name' }, other.token);
    expect(res.status).toBe(201);
  });
});

describe('GET /api/v1/apps', () => {
  it('200: returns an array', async () => {
    const res = await request('GET', '/api/v1/apps', undefined, session.token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: unknown[]; success: boolean };
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('200: includes a previously created app', async () => {
    const created = await createApp('Listed App', session.token);
    const res = await request('GET', '/api/v1/apps', undefined, session.token);

    const json = await res.json() as { data: Array<{ id: string; name: string }> };
    const found = json.data.find((a) => a.id === created.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Listed App');
  });

  it('200: excludes apps owned by a different user', async () => {
    const other = await createUserSession('other@example.com');
    const foreignApp = await createApp('Foreign App', other.token);

    const res = await request('GET', '/api/v1/apps', undefined, session.token);
    const json = await res.json() as { data: Array<{ id: string }> };

    expect(json.data.find((a) => a.id === foreignApp.id)).toBeUndefined();
  });

  it('200: excludes soft-deleted apps', async () => {
    const created = await createApp('Soon Deleted', session.token);
    await request('DELETE', `/api/v1/apps/${created.id}`, undefined, session.token);

    const res = await request('GET', '/api/v1/apps', undefined, session.token);
    const json = await res.json() as { data: Array<{ id: string }> };
    const found = json.data.find((a) => a.id === created.id);
    expect(found).toBeUndefined();
  });

  it('200: response items do not expose deletedAt', async () => {
    await createApp('No Leak App', session.token);
    const res = await request('GET', '/api/v1/apps', undefined, session.token);

    const json = await res.json() as { data: Array<Record<string, unknown>> };
    for (const item of json.data) {
      expect(item.deletedAt).toBeUndefined();
    }
  });
});

describe('GET /api/v1/apps/:appId', () => {
  it('200: returns the app', async () => {
    const created = await createApp('Detail App', session.token);
    const res = await request('GET', `/api/v1/apps/${created.id}`, undefined, session.token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { id: string; name: string; createdAt: string; updatedAt: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(created.id);
    expect(json.data.name).toBe('Detail App');
    expect(ISO8601_RE.test(json.data.createdAt)).toBe(true);
    expect(ISO8601_RE.test(json.data.updatedAt)).toBe(true);
  });

  it('403: other user app is forbidden', async () => {
    const other = await createUserSession('other@example.com');
    const foreignApp = await createApp('Foreign Detail', other.token);

    const res = await request('GET', `/api/v1/apps/${foreignApp.id}`, undefined, session.token);
    expect(res.status).toBe(403);
  });

  it('404: app does not exist', async () => {
    const res = await request('GET', `/api/v1/apps/${GHOST_APP_ID}`, undefined, session.token);

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean; data: null };
    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
  });

  it('404: soft-deleted app is not found', async () => {
    const created = await createApp('Deleted Detail App', session.token);
    await request('DELETE', `/api/v1/apps/${created.id}`, undefined, session.token);

    const res = await request('GET', `/api/v1/apps/${created.id}`, undefined, session.token);
    expect(res.status).toBe(404);
  });

  it('200: response does not expose deletedAt', async () => {
    const created = await createApp('No Leak Detail', session.token);
    const res = await request('GET', `/api/v1/apps/${created.id}`, undefined, session.token);

    const json = await res.json() as { data: Record<string, unknown> };
    expect(json.data.deletedAt).toBeUndefined();
  });
});

describe('PUT /api/v1/apps/:appId', () => {
  it('200: updates the app name', async () => {
    const created = await createApp('Old Name', session.token);
    const res = await request('PUT', `/api/v1/apps/${created.id}`, { name: 'New Name' }, session.token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { id: string; name: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(created.id);
    expect(json.data.name).toBe('New Name');
  });

  it('403: updating another user app is forbidden', async () => {
    const other = await createUserSession('other@example.com');
    const foreignApp = await createApp('Foreign Update', other.token);

    const res = await request('PUT', `/api/v1/apps/${foreignApp.id}`, { name: 'New Name' }, session.token);
    expect(res.status).toBe(403);
  });

  it('422: empty name', async () => {
    const created = await createApp('Valid Name', session.token);
    const res = await request('PUT', `/api/v1/apps/${created.id}`, { name: '' }, session.token);
    expect(res.status).toBe(422);
  });

  it('422: whitespace-only name', async () => {
    const created = await createApp('Has Name', session.token);
    const res = await request('PUT', `/api/v1/apps/${created.id}`, { name: '   ' }, session.token);
    expect(res.status).toBe(422);
  });

  it('422: name exceeds 100 characters', async () => {
    const created = await createApp('Update Too Long', session.token);
    const res = await request('PUT', `/api/v1/apps/${created.id}`, { name: 'b'.repeat(101) }, session.token);
    expect(res.status).toBe(422);
  });

  it('404: app does not exist', async () => {
    const res = await request('PUT', `/api/v1/apps/${GHOST_APP_ID}`, { name: 'Ghost Update' }, session.token);
    expect(res.status).toBe(404);
  });

  it('409: duplicate name when updating within the same user', async () => {
    await createApp('App Alpha', session.token);
    const beta = await createApp('App Beta', session.token);
    const res = await request('PUT', `/api/v1/apps/${beta.id}`, { name: 'App Alpha' }, session.token);
    expect(res.status).toBe(409);
  });

  it('200: updatedAt is later than createdAt after update', async () => {
    const created = await createApp('Time Check', session.token);
    await new Promise((r) => setTimeout(r, 5));
    const res = await request('PUT', `/api/v1/apps/${created.id}`, { name: 'Time Check Updated' }, session.token);

    const json = await res.json() as { data: { createdAt: string; updatedAt: string } };
    const createdAt = new Date(json.data.createdAt).getTime();
    const updatedAt = new Date(json.data.updatedAt).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(createdAt);
  });
});

describe('DELETE /api/v1/apps/:appId', () => {
  it('200: soft-deletes the app and returns it', async () => {
    const created = await createApp('To Delete', session.token);
    const res = await request('DELETE', `/api/v1/apps/${created.id}`, undefined, session.token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { id: string; name: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(created.id);
    expect(json.data.name).toBe('To Delete');
  });

  it('403: deleting another user app is forbidden', async () => {
    const other = await createUserSession('other@example.com');
    const foreignApp = await createApp('Foreign Delete', other.token);

    const res = await request('DELETE', `/api/v1/apps/${foreignApp.id}`, undefined, session.token);
    expect(res.status).toBe(403);
  });

  it('200: deleted app no longer appears in GET /apps list', async () => {
    const created = await createApp('Disappear App', session.token);
    await request('DELETE', `/api/v1/apps/${created.id}`, undefined, session.token);

    const listRes = await request('GET', '/api/v1/apps', undefined, session.token);
    const listJson = await listRes.json() as { data: Array<{ id: string }> };
    expect(listJson.data.find((a) => a.id === created.id)).toBeUndefined();
  });

  it('404: deleted app returns 404 on GET detail', async () => {
    const created = await createApp('Gone App', session.token);
    await request('DELETE', `/api/v1/apps/${created.id}`, undefined, session.token);

    const res = await request('GET', `/api/v1/apps/${created.id}`, undefined, session.token);
    expect(res.status).toBe(404);
  });

  it('404: app does not exist', async () => {
    const res = await request('DELETE', `/api/v1/apps/${GHOST_APP_ID}`, undefined, session.token);
    expect(res.status).toBe(404);
  });

  it('200: cascade-deletes associated todos', async () => {
    const app = await createApp('Cascade App', session.token);
    const todo = await createTodo(app.id, 'Will be cascade-deleted', session.token);

    await request('DELETE', `/api/v1/apps/${app.id}`, undefined, session.token);

    const app2 = await createApp('Cascade App', session.token);
    const todoRes = await request('GET', `/api/v1/apps/${app2.id}/todos/${todo.id}`, undefined, session.token);
    expect(todoRes.status).toBe(404);
  });
});
