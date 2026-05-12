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
  createUserSession,
  type AuthSession,
} from '../helpers';

let session: AuthSession;

beforeEach(async () => {
  clearStorage();
  session = await createUserSession();
});

// ═════════════════════════════════════════════════════════════════════════════
// Todo Endpoints
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/apps/:appId/todos', () => {
  it('401: requires authentication', async () => {
    const createdApp = await createApp('Todo Owner', session.token);
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, { title: 'First Todo' });
    expect(res.status).toBe(401);
  });

  it('201: creates a todo with correct response shape', async () => {
    const createdApp = await createApp('Todo Owner', session.token);
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, { title: 'First Todo' }, session.token);

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

  it('403: cannot create a todo in another user app', async () => {
    const other = await createUserSession('other@example.com');
    const foreignApp = await createApp('Other App', other.token);

    const res = await request('POST', `/api/v1/apps/${foreignApp.id}/todos`, { title: 'Blocked' }, session.token);
    expect(res.status).toBe(403);
  });

  it('422: missing title field', async () => {
    const createdApp = await createApp('App For Missing Title', session.token);
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, {}, session.token);
    expect(res.status).toBe(422);
  });

  it('422: empty title', async () => {
    const createdApp = await createApp('App For Empty Title', session.token);
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, { title: '' }, session.token);
    expect(res.status).toBe(422);
  });

  it('422: whitespace-only title', async () => {
    const createdApp = await createApp('App For Whitespace Title', session.token);
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, { title: '   ' }, session.token);
    expect(res.status).toBe(422);
  });

  it('422: title exceeds 200 characters', async () => {
    const createdApp = await createApp('App For Long Title', session.token);
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, { title: 'c'.repeat(201) }, session.token);
    expect(res.status).toBe(422);
  });

  it('201: title at exactly 200 characters is accepted', async () => {
    const createdApp = await createApp('App For Max Title', session.token);
    const maxTitle = 'c'.repeat(200);
    const res = await request('POST', `/api/v1/apps/${createdApp.id}/todos`, { title: maxTitle }, session.token);

    expect(res.status).toBe(201);

    const json = await res.json() as { data: { title: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.title).toBe(maxTitle);
  });

  it('404: app not found', async () => {
    const res = await request('POST', `/api/v1/apps/${GHOST_APP_ID}/todos`, { title: 'Orphan Todo' }, session.token);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/apps/:appId/todos', () => {
  it('200: returns an array', async () => {
    const createdApp = await createApp('Todo List App', session.token);
    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos`, undefined, session.token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: unknown[]; success: boolean };
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('403: cannot list another user app todos', async () => {
    const other = await createUserSession('other@example.com');
    const foreignApp = await createApp('Other App', other.token);

    const res = await request('GET', `/api/v1/apps/${foreignApp.id}/todos`, undefined, session.token);
    expect(res.status).toBe(403);
  });

  it('200: returns multiple todos', async () => {
    const createdApp = await createApp('Multi Todo App', session.token);
    await createTodo(createdApp.id, 'Todo A', session.token);
    await createTodo(createdApp.id, 'Todo B', session.token);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos`, undefined, session.token);
    const json = await res.json() as { data: Array<{ title: string }> };
    expect(json.data.length).toBe(2);
    const titles = json.data.map((t) => t.title);
    expect(titles).toContain('Todo A');
    expect(titles).toContain('Todo B');
  });

  it('200: excludes soft-deleted todos', async () => {
    const createdApp = await createApp('Soft Delete List App', session.token);
    const todo = await createTodo(createdApp.id, 'Will Be Deleted', session.token);
    await createTodo(createdApp.id, 'Stays', session.token);
    await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${todo.id}`, undefined, session.token);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos`, undefined, session.token);
    const json = await res.json() as { data: Array<{ id: string }> };
    expect(json.data.find((t) => t.id === todo.id)).toBeUndefined();
    expect(json.data.length).toBe(1);
  });

  it('404: app not found', async () => {
    const res = await request('GET', `/api/v1/apps/${GHOST_APP_ID}/todos`, undefined, session.token);
    expect(res.status).toBe(404);
  });

  it('200: response items do not expose deletedAt', async () => {
    const createdApp = await createApp('No Leak Todo List', session.token);
    await createTodo(createdApp.id, 'Check Field', session.token);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos`, undefined, session.token);
    const json = await res.json() as { data: Array<Record<string, unknown>> };
    for (const item of json.data) {
      expect(item.deletedAt).toBeUndefined();
    }
  });
});

describe('GET /api/v1/apps/:appId/todos/:todoId', () => {
  it('200: returns the todo', async () => {
    const createdApp = await createApp('Single Todo App', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Detail Todo', session.token);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, undefined, session.token);

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

  it('403: cannot read another user todo', async () => {
    const other = await createUserSession('other@example.com');
    const foreignApp = await createApp('Other App', other.token);
    const foreignTodo = await createTodo(foreignApp.id, 'Foreign Todo', other.token);

    const res = await request('GET', `/api/v1/apps/${foreignApp.id}/todos/${foreignTodo.id}`, undefined, session.token);
    expect(res.status).toBe(403);
  });

  it('404: todo does not exist', async () => {
    const createdApp = await createApp('Todo 404 App', session.token);
    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos/${GHOST_TODO_ID}`, undefined, session.token);
    expect(res.status).toBe(404);
  });

  it('404: app does not exist', async () => {
    const res = await request('GET', `/api/v1/apps/${GHOST_APP_ID}/todos/${GHOST_TODO_ID}`, undefined, session.token);
    expect(res.status).toBe(404);
  });

  it('404: soft-deleted todo is not found', async () => {
    const createdApp = await createApp('Deleted Todo App', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Delete Me', session.token);
    await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, undefined, session.token);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, undefined, session.token);
    expect(res.status).toBe(404);
  });

  it('200: response does not expose deletedAt', async () => {
    const createdApp = await createApp('No Leak Todo Detail', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Field Check', session.token);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, undefined, session.token);
    const json = await res.json() as { data: Record<string, unknown> };
    expect(json.data.deletedAt).toBeUndefined();
  });
});

describe('PUT /api/v1/apps/:appId/todos/:todoId', () => {
  it('200: updates the title', async () => {
    const createdApp = await createApp('Update Title App', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Old Title', session.token);

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { title: 'New Title' }, session.token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { id: string; title: string }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(createdTodo.id);
    expect(json.data.title).toBe('New Title');
  });

  it('403: cannot update another user todo', async () => {
    const other = await createUserSession('other@example.com');
    const foreignApp = await createApp('Other App', other.token);
    const foreignTodo = await createTodo(foreignApp.id, 'Foreign Todo', other.token);

    const res = await request('PUT', `/api/v1/apps/${foreignApp.id}/todos/${foreignTodo.id}`, { title: 'Blocked' }, session.token);
    expect(res.status).toBe(403);
  });

  it('200: marks todo as completed', async () => {
    const createdApp = await createApp('Complete App', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Complete Me', session.token);

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { completed: true }, session.token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { completed: boolean }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.completed).toBe(true);
  });

  it('200: marks completed todo back to incomplete', async () => {
    const createdApp = await createApp('Uncomplete App', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Toggle Me', session.token);
    await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { completed: true }, session.token);

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { completed: false }, session.token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { completed: boolean } };
    expect(json.data.completed).toBe(false);
  });

  it('422: empty title', async () => {
    const createdApp = await createApp('Empty Title Update App', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Has Title', session.token);

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { title: '' }, session.token);
    expect(res.status).toBe(422);
  });

  it('422: whitespace-only title', async () => {
    const createdApp = await createApp('Whitespace Update App', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Good Title', session.token);

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { title: '   ' }, session.token);
    expect(res.status).toBe(422);
  });

  it('422: title exceeds 200 characters', async () => {
    const createdApp = await createApp('Long Update App', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Normal Title', session.token);

    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, { title: 'd'.repeat(201) }, session.token);
    expect(res.status).toBe(422);
  });

  it('404: todo does not exist', async () => {
    const createdApp = await createApp('Update 404 App', session.token);
    const res = await request('PUT', `/api/v1/apps/${createdApp.id}/todos/${GHOST_TODO_ID}`, { title: 'Ghost Update' }, session.token);
    expect(res.status).toBe(404);
  });

  it('404: app does not exist', async () => {
    const res = await request('PUT', `/api/v1/apps/${GHOST_APP_ID}/todos/${GHOST_TODO_ID}`, { title: 'No App' }, session.token);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/apps/:appId/todos/:todoId', () => {
  it('200: soft-deletes the todo and returns it', async () => {
    const createdApp = await createApp('Delete Todo App', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Delete Todo', session.token);

    const res = await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, undefined, session.token);

    expect(res.status).toBe(200);

    const json = await res.json() as { data: { id: string; title: string; completed: boolean }; success: boolean };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(createdTodo.id);
    expect(json.data.title).toBe('Delete Todo');
  });

  it('403: cannot delete another user todo', async () => {
    const other = await createUserSession('other@example.com');
    const foreignApp = await createApp('Other App', other.token);
    const foreignTodo = await createTodo(foreignApp.id, 'Foreign Todo', other.token);

    const res = await request('DELETE', `/api/v1/apps/${foreignApp.id}/todos/${foreignTodo.id}`, undefined, session.token);
    expect(res.status).toBe(403);
  });

  it('404: deleted todo returns 404 on GET detail', async () => {
    const createdApp = await createApp('After Delete App', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Will Vanish', session.token);
    await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, undefined, session.token);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, undefined, session.token);
    expect(res.status).toBe(404);
  });

  it('404: todo does not exist', async () => {
    const createdApp = await createApp('Delete Ghost App', session.token);
    const res = await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${GHOST_TODO_ID}`, undefined, session.token);
    expect(res.status).toBe(404);
  });

  it('404: app does not exist', async () => {
    const res = await request('DELETE', `/api/v1/apps/${GHOST_APP_ID}/todos/${GHOST_TODO_ID}`, undefined, session.token);
    expect(res.status).toBe(404);
  });

  it('200: deleted todo is excluded from GET list', async () => {
    const createdApp = await createApp('Exclude Deleted App', session.token);
    const createdTodo = await createTodo(createdApp.id, 'Excluded Todo', session.token);
    await createTodo(createdApp.id, 'Remaining Todo', session.token);
    await request('DELETE', `/api/v1/apps/${createdApp.id}/todos/${createdTodo.id}`, undefined, session.token);

    const res = await request('GET', `/api/v1/apps/${createdApp.id}/todos`, undefined, session.token);
    const json = await res.json() as { data: Array<{ id: string }> };
    expect(json.data.find((t) => t.id === createdTodo.id)).toBeUndefined();
    expect(json.data.length).toBe(1);
  });
});
