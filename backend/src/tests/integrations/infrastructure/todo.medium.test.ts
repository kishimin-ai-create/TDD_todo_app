import { describe, it, expect, beforeEach } from 'vitest';

import {
  clearStorage,
  GHOST_APP_ID,
  GHOST_TODO_ID,
  UUID_RE,
  ISO8601_RE,
  request,
  createApp,
  createTodo,
} from '../helpers';

beforeEach(() => clearStorage());

// ═════════════════════════════════════════════════════════════════════════════
// Todo Endpoints
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/apps/:appId/todos', () => {
  it('201: creates a todo with correct response shape', async () => {
    const createdApp = await createApp('Todo Owner');
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, { title: 'First Todo' });

    expect(res.status).toBe(201);

    const json = await res.json() as { data: Record<string, unknown>; success: boolean };
    expect(json.success).toBe(true);
    expect(UUID_RE.test(json.data.id as string)).toBe(true);
    expect(json.data.appId).toBe(createdApp.id);
    expect(json.data.title).toBe('First Todo');
    expect(json.data.completed).toBe(false);
    expect(ISO8601_RE.test(json.data.createdAt as string)).toBe(true);
    expect(ISO8601_RE.test(json.data.updatedAt as string)).toBe(true);
    expect(json.data.deletedAt).toBeUndefined();
  });

  it('422: missing title field', async () => {
    const createdApp = await createApp('App For Missing Title');
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, {});

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean; data: null; error: { code: string } };
    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
    expect(typeof json.error.code).toBe('string');
  });

  it('422: empty title', async () => {
    const createdApp = await createApp('App For Empty Title');
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, { title: '' });

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('422: whitespace-only title', async () => {
    const createdApp = await createApp('App For Whitespace Title');
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, { title: '   ' });

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('422: title exceeds 200 characters', async () => {
    const createdApp = await createApp('App For Long Title');
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, { title: 'c'.repeat(201) });

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('201: title at exactly 200 characters is accepted', async () => {
    const createdApp = await createApp('App For Max Title');
    const maxTitle = 'c'.repeat(200);
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, { title: maxTitle });

    expect(res.status).toBe(201);

    const json = await res.json() as { data: { title: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.title).toBe(maxTitle);
  });

  it('404: app not found', async () => {
    const res = await request('POST', `/api/v1/apps/${GHOST_APP_ID}/todos`, { title: 'Orphan Todo' });

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean; data: null };
    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/apps/:appId/todos', () => {
  it('200: returns an array', async () => {
    const createdApp = await createApp('Todo List App');
    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos`);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: unknown[]; success: boolean };
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('200: returns multiple todos', async () => {
    const createdApp = await createApp('Multi Todo App');
    await createTodo(createdApp.id, 'Todo A');
    await createTodo(createdApp.id, 'Todo B');

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos`);
    const json = await res.json() as { data: Array<{ title: string }> };
    expect(json.data.length).toBe(2);
    const titles = json.data.map((t) => t.title);
    expect(titles).toContain('Todo A');
    expect(titles).toContain('Todo B');
  });

  it('200: excludes soft-deleted todos', async () => {
    const createdApp = await createApp('Soft Delete List App');
    const todo = await createTodo(createdApp.id, 'Will Be Deleted');
    await createTodo(createdApp.id, 'Stays');
    await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${todo.id}`);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos`);
    const json = await res.json() as { data: Array<{ id: string }> };
    expect(json.data.find((t) => t.id === todo.id)).toBeUndefined();
    expect(json.data.length).toBe(1);
  });

  it('404: app not found', async () => {
    const res = await request('GET', `/api/v1/apps/${GHOST_APP_ID}/todos`);

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('200: response items do not expose deletedAt', async () => {
    const createdApp = await createApp('No Leak Todo List');
    await createTodo(createdApp.id, 'Check Field');

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos`);
    const json = await res.json() as { data: Array<Record<string, unknown>> };
    for (const item of json.data) {
      expect(item.deletedAt).toBeUndefined();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/apps/:appId/todos/:todoId', () => {
  it('200: returns the todo', async () => {
    const createdApp = await createApp('Single Todo App');
    const createdTodo = await createTodo(createdApp.id, 'Detail Todo');

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { id: string; appId: string; title: string; completed: boolean; createdAt: string; updatedAt: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(createdTodo.id);
    expect(json.data.appId).toBe(createdApp.id);
    expect(json.data.title).toBe('Detail Todo');
    expect(json.data.completed).toBe(false);
    expect(ISO8601_RE.test(json.data.createdAt)).toBe(true);
    expect(ISO8601_RE.test(json.data.updatedAt)).toBe(true);
  });

  it('404: todo does not exist', async () => {
    const createdApp = await createApp('Todo 404 App');
    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos/${GHOST_TODO_ID}`);

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean; data: null };
    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
  });

  it('404: app does not exist', async () => {
    const res = await request('GET', `/api/v1/apps/${GHOST_APP_ID}/todos/${GHOST_TODO_ID}`);

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('404: soft-deleted todo is not found', async () => {
    const createdApp = await createApp('Deleted Todo App');
    const createdTodo = await createTodo(createdApp.id, 'Delete Me');
    await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`);
    expect(res.status).toBe(404);
  });

  it('200: response does not expose deletedAt', async () => {
    const createdApp = await createApp('No Leak Todo Detail');
    const createdTodo = await createTodo(createdApp.id, 'Field Check');

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`);
    const json = await res.json() as { data: Record<string, unknown> };
    expect(json.data.deletedAt).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/v1/apps/:appId/todos/:todoId', () => {
  it('200: updates the title', async () => {
    const createdApp = await createApp('Update Title App');
    const createdTodo = await createTodo(createdApp.id, 'Old Title');

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { title: 'New Title' });

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { id: string; title: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(createdTodo.id);
    expect(json.data.title).toBe('New Title');
  });

  it('200: marks todo as completed', async () => {
    const createdApp = await createApp('Complete App');
    const createdTodo = await createTodo(createdApp.id, 'Complete Me');

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { completed: true });

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { completed: boolean }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.completed).toBe(true);
  });

  it('200: marks completed todo back to incomplete', async () => {
    const createdApp = await createApp('Uncomplete App');
    const createdTodo = await createTodo(createdApp.id, 'Toggle Me');
    await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { completed: true });

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { completed: false });

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { completed: boolean } };
    expect(json.data.completed).toBe(false);
  });

  it('422: empty title', async () => {
    const createdApp = await createApp('Empty Title Update App');
    const createdTodo = await createTodo(createdApp.id, 'Has Title');

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { title: '' });

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('422: whitespace-only title', async () => {
    const createdApp = await createApp('Whitespace Update App');
    const createdTodo = await createTodo(createdApp.id, 'Good Title');

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { title: '   ' });

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('422: title exceeds 200 characters', async () => {
    const createdApp = await createApp('Long Update App');
    const createdTodo = await createTodo(createdApp.id, 'Normal Title');

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { title: 'd'.repeat(201) });

    expect(res.status).toBe(422);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('404: todo does not exist', async () => {
    const createdApp = await createApp('Update 404 App');
    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${GHOST_TODO_ID}`, { title: 'Ghost Update' });

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('404: app does not exist', async () => {
    const res = await request('PUT', `/api/v1/apps/${GHOST_APP_ID}/todos/${GHOST_TODO_ID}`, { title: 'No App' });

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/v1/apps/:appId/todos/:todoId', () => {
  it('200: soft-deletes the todo and returns it', async () => {
    const createdApp = await createApp('Delete Todo App');
    const createdTodo = await createTodo(createdApp.id, 'Delete Todo');

    const res = await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { id: string; title: string; completed: boolean }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(createdTodo.id);
    expect(json.data.title).toBe('Delete Todo');
  });

  it('404: deleted todo returns 404 on GET detail', async () => {
    const createdApp = await createApp('After Delete App');
    const createdTodo = await createTodo(createdApp.id, 'Will Vanish');
    await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`);
    expect(res.status).toBe(404);
  });

  it('404: todo does not exist', async () => {
    const createdApp = await createApp('Delete Ghost App');
    const res = await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${GHOST_TODO_ID}`);

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('404: app does not exist', async () => {
    const res = await request('DELETE', `/api/v1/apps/${GHOST_APP_ID}/todos/${GHOST_TODO_ID}`);

    expect(res.status).toBe(404);

    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(false);
  });

  it('200: deleted todo is excluded from GET list', async () => {
    const createdApp = await createApp('Exclude Deleted App');
    const createdTodo = await createTodo(createdApp.id, 'Excluded Todo');
    await createTodo(createdApp.id, 'Remaining Todo');
    await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos`);
    const json = await res.json() as { data: Array<{ id: string }> };
    expect(json.data.find((t) => t.id === createdTodo.id)).toBeUndefined();
    expect(json.data.length).toBe(1);
  });
});
