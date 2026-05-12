import { describe, it, expect, beforeEach } from 'vitest';

import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';
import { createTodoInteractor } from '../../../services/todo-interactor';
import { createTodoController } from '../../../controllers/todo-controller';

const GHOST_APP_ID = '00000000-0000-0000-0000-000000000000';
const GHOST_TODO_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

function setup() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const appInteractor = createAppInteractor({ appRepository, todoRepository });
  const todoInteractor = createTodoInteractor({ appRepository, todoRepository });
  const controller = createTodoController(todoInteractor);
  return { controller, appInteractor };
}

describe('TodoController integration', () => {
  let ctx: ReturnType<typeof setup>;
  let appId: string;

  beforeEach(async () => {
    ctx = setup();
    const app = await ctx.appInteractor.create({ name: 'Test App', userId: USER_ID });
    appId = app.id;
  });

  describe('create', () => {
    it('returns 201 with success:true and todo DTO on valid input', async () => {
      const res = await ctx.controller.create(appId, { title: 'My Todo' }, USER_ID);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        id: expect.any(String),
        appId,
        title: 'My Todo',
        completed: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('returns 403 when the app belongs to another user', async () => {
      const otherApp = await ctx.appInteractor.create({ name: 'Other App', userId: OTHER_USER_ID });
      const res = await ctx.controller.create(otherApp.id, { title: 'Blocked' }, USER_ID);
      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN');
    });

    it('returns 404 when the app does not exist', async () => {
      const res = await ctx.controller.create(GHOST_APP_ID, { title: 'Orphan' }, USER_ID);
      expect(res.status).toBe(404);
    });
  });

  describe('list', () => {
    it('returns 200 with empty array when no todos', async () => {
      const res = await ctx.controller.list(appId, USER_ID);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns 403 when the app belongs to another user', async () => {
      const otherApp = await ctx.appInteractor.create({ name: 'Other App', userId: OTHER_USER_ID });
      const res = await ctx.controller.list(otherApp.id, USER_ID);
      expect(res.status).toBe(403);
    });
  });

  describe('get', () => {
    it('returns 200 with the correct todo', async () => {
      const created = await ctx.controller.create(appId, { title: 'Get Me' }, USER_ID);
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.get(appId, todoId, USER_ID);
      expect(res.status).toBe(200);
      expect((res.body.data as { id: string }).id).toBe(todoId);
    });

    it('returns 403 when the app belongs to another user', async () => {
      const otherApp = await ctx.appInteractor.create({ name: 'Other App', userId: OTHER_USER_ID });
      const created = await ctx.controller.create(otherApp.id, { title: 'Other Todo' }, OTHER_USER_ID);
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.get(otherApp.id, todoId, USER_ID);
      expect(res.status).toBe(403);
    });

    it('returns 404 for an unknown todoId', async () => {
      const res = await ctx.controller.get(appId, GHOST_TODO_ID, USER_ID);
      expect(res.status).toBe(404);
    });
  });

  describe('update', () => {
    it('returns 200 with updated title', async () => {
      const created = await ctx.controller.create(appId, { title: 'Old' }, USER_ID);
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.update(appId, todoId, { title: 'New' }, USER_ID);
      expect(res.status).toBe(200);
      expect((res.body.data as { title: string }).title).toBe('New');
    });

    it('returns 403 when the app belongs to another user', async () => {
      const otherApp = await ctx.appInteractor.create({ name: 'Other App', userId: OTHER_USER_ID });
      const created = await ctx.controller.create(otherApp.id, { title: 'Other Todo' }, OTHER_USER_ID);
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.update(otherApp.id, todoId, { title: 'Blocked' }, USER_ID);
      expect(res.status).toBe(403);
    });
  });

  describe('delete', () => {
    it('returns 200 with the soft-deleted todo', async () => {
      const created = await ctx.controller.create(appId, { title: 'Del' }, USER_ID);
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.delete(appId, todoId, USER_ID);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 403 when the app belongs to another user', async () => {
      const otherApp = await ctx.appInteractor.create({ name: 'Other App', userId: OTHER_USER_ID });
      const created = await ctx.controller.create(otherApp.id, { title: 'Other Todo' }, OTHER_USER_ID);
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.delete(otherApp.id, todoId, USER_ID);
      expect(res.status).toBe(403);
    });

    it('returns 404 for unknown todo', async () => {
      const res = await ctx.controller.delete(appId, GHOST_TODO_ID, USER_ID);
      expect(res.status).toBe(404);
    });
  });
});
