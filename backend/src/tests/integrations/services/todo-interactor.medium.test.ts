import { describe, it, expect, beforeEach } from 'vitest';

import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';
import { createTodoInteractor } from '../../../services/todo-interactor';
import type { TodoUsecase } from '../../../services/todo-usecase';

const GHOST_APP_ID = '00000000-0000-0000-0000-000000000000';
const GHOST_TODO_ID = '11111111-1111-1111-1111-111111111111';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function setup() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const appInteractor = createAppInteractor({ appRepository, todoRepository });
  const interactor: TodoUsecase = createTodoInteractor({ appRepository, todoRepository });
  return { storage, appRepository, todoRepository, appInteractor, interactor };
}

describe('TodoInteractor integration', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a todo with UUID id, correct appId, and ISO timestamps', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      const todo = await ctx.interactor.create({ appId: app.id, title: 'My Todo' });
      expect(UUID_RE.test(todo.id)).toBe(true);
      expect(todo.appId).toBe(app.id);
      expect(todo.title).toBe('My Todo');
      expect(todo.completed).toBe(false);
      expect(ISO_RE.test(todo.createdAt)).toBe(true);
      expect(ISO_RE.test(todo.updatedAt)).toBe(true);
      expect(todo.deletedAt).toBeNull();
    });

    it('persists to repository so it appears in list', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      const todo = await ctx.interactor.create({ appId: app.id, title: 'Listed' });
      const list = await ctx.interactor.list({ appId: app.id });
      expect(list.some(t => t.id === todo.id)).toBe(true);
    });

    it('throws NOT_FOUND when the app does not exist', async () => {
      await expect(
        ctx.interactor.create({ appId: GHOST_APP_ID, title: 'Orphan' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ─── list ────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns an empty array when no todos exist for the app', async () => {
      const app = await ctx.appInteractor.create({ name: 'Empty App' });
      expect(await ctx.interactor.list({ appId: app.id })).toEqual([]);
    });

    it('returns all active todos for the app', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      await ctx.interactor.create({ appId: app.id, title: 'T1' });
      await ctx.interactor.create({ appId: app.id, title: 'T2' });
      expect(await ctx.interactor.list({ appId: app.id })).toHaveLength(2);
    });

    it('excludes soft-deleted todos', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      const todo = await ctx.interactor.create({ appId: app.id, title: 'Del' });
      await ctx.interactor.delete({ appId: app.id, todoId: todo.id });
      const list = await ctx.interactor.list({ appId: app.id });
      expect(list.find(t => t.id === todo.id)).toBeUndefined();
    });

    it('throws NOT_FOUND when the app does not exist', async () => {
      await expect(ctx.interactor.list({ appId: GHOST_APP_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  // ─── get ─────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('returns the correct todo by appId and todoId', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      const todo = await ctx.interactor.create({ appId: app.id, title: 'Get Me' });
      const found = await ctx.interactor.get({ appId: app.id, todoId: todo.id });
      expect(found.id).toBe(todo.id);
      expect(found.title).toBe('Get Me');
    });

    it('throws NOT_FOUND for an unknown todoId', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      await expect(
        ctx.interactor.get({ appId: app.id, todoId: GHOST_TODO_ID }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when the app does not exist', async () => {
      await expect(
        ctx.interactor.get({ appId: GHOST_APP_ID, todoId: GHOST_TODO_ID }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates the title', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      const todo = await ctx.interactor.create({ appId: app.id, title: 'Old' });
      const updated = await ctx.interactor.update({ appId: app.id, todoId: todo.id, title: 'New' });
      expect(updated.title).toBe('New');
      expect(updated.id).toBe(todo.id);
    });

    it('marks todo as completed', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      const todo = await ctx.interactor.create({ appId: app.id, title: 'Complete Me' });
      const updated = await ctx.interactor.update({
        appId: app.id,
        todoId: todo.id,
        completed: true,
      });
      expect(updated.completed).toBe(true);
    });

    it('marks a completed todo back to incomplete', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      const todo = await ctx.interactor.create({ appId: app.id, title: 'Toggle' });
      await ctx.interactor.update({ appId: app.id, todoId: todo.id, completed: true });
      const toggled = await ctx.interactor.update({
        appId: app.id,
        todoId: todo.id,
        completed: false,
      });
      expect(toggled.completed).toBe(false);
    });

    it('preserves title and completed when neither is updated', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      const todo = await ctx.interactor.create({ appId: app.id, title: 'Stable' });
      const updated = await ctx.interactor.update({ appId: app.id, todoId: todo.id });
      expect(updated.title).toBe('Stable');
      expect(updated.completed).toBe(false);
    });

    it('throws NOT_FOUND for an unknown todo', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      await expect(
        ctx.interactor.update({ appId: app.id, todoId: GHOST_TODO_ID, title: 'X' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when the app does not exist', async () => {
      await expect(
        ctx.interactor.update({ appId: GHOST_APP_ID, todoId: GHOST_TODO_ID }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('soft-deletes the todo and returns it with deletedAt set', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      const todo = await ctx.interactor.create({ appId: app.id, title: 'Del' });
      const deleted = await ctx.interactor.delete({ appId: app.id, todoId: todo.id });
      expect(deleted.id).toBe(todo.id);
      expect(deleted.deletedAt).not.toBeNull();
      expect(ISO_RE.test(deleted.deletedAt as string)).toBe(true);
    });

    it('deleted todo is no longer in the list', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      const todo = await ctx.interactor.create({ appId: app.id, title: 'Del' });
      await ctx.interactor.delete({ appId: app.id, todoId: todo.id });
      const list = await ctx.interactor.list({ appId: app.id });
      expect(list.find(t => t.id === todo.id)).toBeUndefined();
    });

    it('throws NOT_FOUND for an unknown todo', async () => {
      const app = await ctx.appInteractor.create({ name: 'App' });
      await expect(
        ctx.interactor.delete({ appId: app.id, todoId: GHOST_TODO_ID }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when the app does not exist', async () => {
      await expect(
        ctx.interactor.delete({ appId: GHOST_APP_ID, todoId: GHOST_TODO_ID }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
