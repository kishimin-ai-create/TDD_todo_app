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
    const app = await ctx.appInteractor.create({ name: 'Test App' });
    appId = app.id;
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('returns 201 with success:true and todo DTO on valid input', async () => {
      const res = await ctx.controller.create(appId, { title: 'My Todo' });
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

    it('DTO does not include deletedAt', async () => {
      const res = await ctx.controller.create(appId, { title: 'Todo' });
      expect(res.body.data).not.toHaveProperty('deletedAt');
    });

    it('returns 422 when title is missing', async () => {
      const res = await ctx.controller.create(appId, {});
      expect(res.status).toBe(422);
      expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    });

    it('returns 422 when title is not a string', async () => {
      const res = await ctx.controller.create(appId, { title: 123 });
      expect(res.status).toBe(422);
    });

    it('returns 422 when title is whitespace only', async () => {
      const res = await ctx.controller.create(appId, { title: '   ' });
      expect(res.status).toBe(422);
    });

    it('returns 404 when the app does not exist', async () => {
      const res = await ctx.controller.create(GHOST_APP_ID, { title: 'Orphan' });
      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe('NOT_FOUND');
    });

    it('returns 422 when body is null', async () => {
      const res = await ctx.controller.create(appId, null);
      expect(res.status).toBe(422);
    });
  });

  // ─── list ────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns 200 with empty array when no todos', async () => {
      const res = await ctx.controller.list(appId);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns 200 with all todos for the app', async () => {
      await ctx.controller.create(appId, { title: 'T1' });
      await ctx.controller.create(appId, { title: 'T2' });
      const res = await ctx.controller.list(appId);
      expect((res.body.data as unknown[]).length).toBe(2);
    });

    it('returns 404 when the app does not exist', async () => {
      const res = await ctx.controller.list(GHOST_APP_ID);
      expect(res.status).toBe(404);
    });
  });

  // ─── get ─────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('returns 200 with the correct todo', async () => {
      const created = await ctx.controller.create(appId, { title: 'Get Me' });
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.get(appId, todoId);
      expect(res.status).toBe(200);
      expect((res.body.data as { id: string }).id).toBe(todoId);
    });

    it('returns 404 for an unknown todoId', async () => {
      const res = await ctx.controller.get(appId, GHOST_TODO_ID);
      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe('NOT_FOUND');
    });

    it('returns 404 when the app does not exist', async () => {
      const res = await ctx.controller.get(GHOST_APP_ID, GHOST_TODO_ID);
      expect(res.status).toBe(404);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('returns 200 with updated title', async () => {
      const created = await ctx.controller.create(appId, { title: 'Old' });
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.update(appId, todoId, { title: 'New' });
      expect(res.status).toBe(200);
      expect((res.body.data as { title: string }).title).toBe('New');
    });

    it('returns 200 with completed set to true', async () => {
      const created = await ctx.controller.create(appId, { title: 'Do It' });
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.update(appId, todoId, { completed: true });
      expect(res.status).toBe(200);
      expect((res.body.data as { completed: boolean }).completed).toBe(true);
    });

    it('returns 422 when completed is not a boolean', async () => {
      const created = await ctx.controller.create(appId, { title: 'Toggle' });
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.update(appId, todoId, { completed: 'yes' });
      expect(res.status).toBe(422);
    });

    it('returns 422 when updated title is empty', async () => {
      const created = await ctx.controller.create(appId, { title: 'Valid' });
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.update(appId, todoId, { title: '' });
      expect(res.status).toBe(422);
    });

    it('returns 404 for unknown todo', async () => {
      const res = await ctx.controller.update(appId, GHOST_TODO_ID, { title: 'X' });
      expect(res.status).toBe(404);
    });

    it('returns 404 when app does not exist', async () => {
      const res = await ctx.controller.update(GHOST_APP_ID, GHOST_TODO_ID, {});
      expect(res.status).toBe(404);
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('returns 200 with the soft-deleted todo', async () => {
      const created = await ctx.controller.create(appId, { title: 'Del' });
      const todoId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.delete(appId, todoId);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for unknown todo', async () => {
      const res = await ctx.controller.delete(appId, GHOST_TODO_ID);
      expect(res.status).toBe(404);
    });

    it('returns 404 when app does not exist', async () => {
      const res = await ctx.controller.delete(GHOST_APP_ID, GHOST_TODO_ID);
      expect(res.status).toBe(404);
    });
  });
});
