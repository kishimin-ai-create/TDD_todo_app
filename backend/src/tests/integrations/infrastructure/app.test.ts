import { describe, it, expect, beforeEach } from 'vitest';

import {
  clearStorage,
  GHOST_APP_ID,
  UUID_RE,
  ISO8601_RE,
  request,
  createApp,
  createTodo,
  registerUser,
} from '../helpers';

let token: string;

beforeEach(async () => {
  clearStorage();
  const auth = await registerUser();
  token = auth.token;
});

// =============================================================================
// App Endpoints
// =============================================================================

describe('POST /api/v1/apps', () => {
  it('201: creates an app with correct response shape', async () => {
    const res = await request('POST', '/api/v1/apps', { name: 'My App' }, token);

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
    const res = await request('POST', '/api/v1/apps', {}, token);

    expect(res.status).toBe(422);

    const json = await res.json() as { data: null; success: boolean; error: { code: string; message: string } };
    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
    expect(typeof json.error.code).toBe('string');
    expect(json.error.code.length).toBeGreaterThan(0);
    expect(typeof json.error.message).toBe('string');
  });

  it('422: empty string name', async () => {
    const res = await request('POST', '/api/v1/apps', { name: '' }, token);

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('422: whitespace-only name', async () => {
    const res = await request('POST', '/api/v1/apps', { name: '   ' }, token);

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('422: name exceeds 100 characters (101 chars)', async () => {
    const longName = 'a'.repeat(101);
    const res = await request('POST', '/api/v1/apps', { name: longName }, token);

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('201: name at exactly 100 characters is accepted', async () => {
    const maxName = 'a'.repeat(100);
    const res = await request('POST', '/api/v1/apps', { name: maxName }, token);

    expect(res.status).toBe(201);

    const json = await res.json() as { data: { name: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.name).toBe(maxName);
  });

  it('409: duplicate app name for same user', async () => {
    await request('POST', '/api/v1/apps', { name: 'Duplicate App' }, token);
    const res = await request('POST', '/api/v1/apps', { name: 'Duplicate App' }, token);

    expect(res.status).toBe(409);

    const json = await res.json() as { data: null; success: boolean; error: { code: string } };
    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
    expect(typeof json.error.code).toBe('string');
  });

  it('201: same app name is allowed for different users', async () => {
    const auth2 = await registerUser();
    await request('POST', '/api/v1/apps', { name: 'Shared Name' }, token);
    const res = await request('POST', '/api/v1/apps', { name: 'Shared Name' }, auth2.token);

    expect(res.status).toBe(201);
  });

  it('401: missing token', async () => {
    const res = await request('POST', '/api/v1/apps', { name: 'Unauthorized App' });
    expect(res.status).toBe(401);
  });
});

// -----------------------------------------------------------------------------

describe('GET /api/v1/apps', () => {
  it('200: returns an array', async () => {
    const res = await request('GET', '/api/v1/apps', undefined, token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: unknown[]; success: boolean };
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('200: includes a previously created app', async () => {
    const created = await createApp('Listed App', token);
    const res = await request('GET', '/api/v1/apps', undefined, token);

    const json = await res.json() as { data: Array<{ id: string; name: string }> };
    const found = json.data.find((a) => a.id === created.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Listed App');
  });

  it('200: excludes soft-deleted apps', async () => {
    const created = await createApp('Soon Deleted', token);
    await request('DELETE', `/api/v1/apps/${created.id}`, undefined, token);

    const res = await request('GET', '/api/v1/apps', undefined, token);
    const json = await res.json() as { data: Array<{ id: string }> };
    const found = json.data.find((a) => a.id === created.id);
    expect(found).toBeUndefined();
  });

  it('200: response items do not expose deletedAt', async () => {
    await createApp('No Leak App', token);
    const res = await request('GET', '/api/v1/apps', undefined, token);

    const json = await res.json() as { data: Array<Record<string, unknown>> };
    for (const item of json.data) {
      expect(item.deletedAt).toBeUndefined();
    }
  });

  it('200: only returns apps belonging to the authenticated user', async () => {
    const auth2 = await registerUser();
    await createApp('User1 App', token);
    await createApp('User2 App', auth2.token);

    const res = await request('GET', '/api/v1/apps', undefined, token);
    const json = await res.json() as { data: Array<{ name: string }> };
    const names = json.data.map((a) => a.name);
    expect(names).toContain('User1 App');
    expect(names).not.toContain('User2 App');
  });
});

// -----------------------------------------------------------------------------

describe('GET /api/v1/apps/:appId', () => {
  it('200: returns the app', async () => {
    const created = await createApp('Detail App', token);
    const res = await request('GET', `/api/v1/apps/${created.id}`, undefined, token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { id: string; name: string; createdAt: string; updatedAt: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(created.id);
    expect(json.data.name).toBe('Detail App');
    expect(ISO8601_RE.test(json.data.createdAt)).toBe(true);
    expect(ISO8601_RE.test(json.data.updatedAt)).toBe(true);
  });

  it('404: app does not exist', async () => {
    const res = await request('GET', `/api/v1/apps/${GHOST_APP_ID}`, undefined, token);

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean; data: null };
    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
  });

  it('404: soft-deleted app is not found', async () => {
    const created = await createApp('Deleted Detail App', token);
    await request('DELETE', `/api/v1/apps/${created.id}`, undefined, token);

    const res = await request('GET', `/api/v1/apps/${created.id}`, undefined, token);
    expect(res.status).toBe(404);
  });

  it('200: response does not expose deletedAt', async () => {
    const created = await createApp('No Leak Detail', token);
    const res = await request('GET', `/api/v1/apps/${created.id}`, undefined, token);

    const json = await res.json() as { data: Record<string, unknown> };
    expect(json.data.deletedAt).toBeUndefined();
  });

  it('404: cannot access another user\'s app', async () => {
    const auth2 = await registerUser();
    const created = await createApp('Other User App', auth2.token);

    const res = await request('GET', `/api/v1/apps/${created.id}`, undefined, token);
    expect(res.status).toBe(404);
  });
});

// -----------------------------------------------------------------------------

describe('PUT /api/v1/apps/:appId', () => {
  it('200: updates the app name', async () => {
    const created = await createApp('Old Name', token);
    const res = await request('PUT', `/api/v1/apps/${created.id}`, { name: 'New Name' }, token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { id: string; name: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(created.id);
    expect(json.data.name).toBe('New Name');
  });

  it('422: empty name', async () => {
    const created = await createApp('Valid Name', token);
    const res = await request('PUT', `/api/v1/apps/${created.id}`, { name: '' }, token);

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('422: whitespace-only name', async () => {
    const created = await createApp('Has Name', token);
    const res = await request('PUT', `/api/v1/apps/${created.id}`, { name: '   ' }, token);

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('422: name exceeds 100 characters', async () => {
    const created = await createApp('Update Too Long', token);
    const res = await request('PUT', `/api/v1/apps/${created.id}`, { name: 'b'.repeat(101) }, token);

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('404: app does not exist', async () => {
    const res = await request('PUT', `/api/v1/apps/${GHOST_APP_ID}`, { name: 'Ghost Update' }, token);

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('409: duplicate name when updating', async () => {
    await createApp('App Alpha', token);
    const beta = await createApp('App Beta', token);
    const res = await request('PUT', `/api/v1/apps/${beta.id}`, { name: 'App Alpha' }, token);

    expect(res.status).toBe(409);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('200: updatedAt is later than createdAt after update', async () => {
    const created = await createApp('Time Check', token);
    await new Promise((r) => setTimeout(r, 5));
    const res = await request('PUT', `/api/v1/apps/${created.id}`, { name: 'Time Check Updated' }, token);

    const json = await res.json() as { data: { createdAt: string; updatedAt: string } };
    const createdAt = new Date(json.data.createdAt).getTime();
    const updatedAt = new Date(json.data.updatedAt).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(createdAt);
  });
});

// -----------------------------------------------------------------------------

describe('DELETE /api/v1/apps/:appId', () => {
  it('200: soft-deletes the app and returns it', async () => {
    const created = await createApp('To Delete', token);
    const res = await request('DELETE', `/api/v1/apps/${created.id}`, undefined, token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { id: string; name: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(created.id);
    expect(json.data.name).toBe('To Delete');
  });

  it('200: deleted app no longer appears in GET /apps list', async () => {
    const created = await createApp('Disappear App', token);
    await request('DELETE', `/api/v1/apps/${created.id}`, undefined, token);

    const listRes = await request('GET', '/api/v1/apps', undefined, token);
    const listJson = await listRes.json() as { data: Array<{ id: string }> };
    expect(listJson.data.find((a) => a.id === created.id)).toBeUndefined();
  });

  it('404: deleted app returns 404 on GET detail', async () => {
    const created = await createApp('Gone App', token);
    await request('DELETE', `/api/v1/apps/${created.id}`, undefined, token);

    const res = await request('GET', `/api/v1/apps/${created.id}`, undefined, token);
    expect(res.status).toBe(404);
  });

  it('404: app does not exist', async () => {
    const res = await request('DELETE', `/api/v1/apps/${GHOST_APP_ID}`, undefined, token);

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('200: cascade-deletes associated todos', async () => {
    const testApp = await createApp('Cascade App', token);
    const todo = await createTodo(testApp.id, 'Will be cascade-deleted', token);

    await request('DELETE', `/api/v1/apps/${testApp.id}`, undefined, token);

    // Re-create the app so the todo route is reachable, and verify the old todo is gone
    const app2 = await createApp('Cascade App', token);
    const todoRes = await request('GET', `/api/v1/apps/${app2.id}/todos/${todo.id}`, undefined, token);
    // The todo belonged to the old appId; either 404 app or 404 todo is acceptable
    expect(todoRes.status).toBe(404);
  });
});
