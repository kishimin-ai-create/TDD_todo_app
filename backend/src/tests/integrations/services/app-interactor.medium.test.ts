import { describe, it, expect, beforeEach } from 'vitest';

import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';
import type { AppUsecase } from '../../../services/app-usecase';
import type { TodoEntity } from '../../../models/todo';

const GHOST_ID = '00000000-0000-0000-0000-000000000000';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function setup() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const interactor: AppUsecase = createAppInteractor({ appRepository, todoRepository });
  return { storage, appRepository, todoRepository, interactor };
}

describe('AppInteractor integration', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates an app with a UUID id and ISO timestamps', async () => {
      const app = await ctx.interactor.create({ name: 'My App' });
      expect(UUID_RE.test(app.id)).toBe(true);
      expect(app.name).toBe('My App');
      expect(ISO_RE.test(app.createdAt)).toBe(true);
      expect(ISO_RE.test(app.updatedAt)).toBe(true);
      expect(app.deletedAt).toBeNull();
    });

    it('createdAt equals updatedAt on initial creation', async () => {
      const app = await ctx.interactor.create({ name: 'New App' });
      expect(app.createdAt).toBe(app.updatedAt);
    });

    it('persists to repository so it appears in list', async () => {
      const app = await ctx.interactor.create({ name: 'Listed App' });
      const list = await ctx.interactor.list();
      expect(list.some(a => a.id === app.id)).toBe(true);
    });

    it('throws CONFLICT when the name is already taken', async () => {
      await ctx.interactor.create({ name: 'Dup' });
      await expect(ctx.interactor.create({ name: 'Dup' })).rejects.toMatchObject({
        code: 'CONFLICT',
      });
    });

    it('allows creating two apps with different names', async () => {
      const a1 = await ctx.interactor.create({ name: 'App A' });
      const a2 = await ctx.interactor.create({ name: 'App B' });
      expect(a1.id).not.toBe(a2.id);
    });
  });

  // ─── list ────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns an empty array when no apps exist', async () => {
      expect(await ctx.interactor.list()).toEqual([]);
    });

    it('returns all created apps', async () => {
      await ctx.interactor.create({ name: 'A' });
      await ctx.interactor.create({ name: 'B' });
      expect(await ctx.interactor.list()).toHaveLength(2);
    });

    it('excludes soft-deleted apps', async () => {
      const app = await ctx.interactor.create({ name: 'Del' });
      await ctx.interactor.delete({ appId: app.id });
      const list = await ctx.interactor.list();
      expect(list.find(a => a.id === app.id)).toBeUndefined();
    });
  });

  // ─── get ─────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('returns the correct app by id', async () => {
      const app = await ctx.interactor.create({ name: 'Get Me' });
      const found = await ctx.interactor.get({ appId: app.id });
      expect(found.id).toBe(app.id);
      expect(found.name).toBe('Get Me');
    });

    it('throws NOT_FOUND for an unknown id', async () => {
      await expect(ctx.interactor.get({ appId: GHOST_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws NOT_FOUND for a soft-deleted app', async () => {
      const app = await ctx.interactor.create({ name: 'Del Me' });
      await ctx.interactor.delete({ appId: app.id });
      await expect(ctx.interactor.get({ appId: app.id })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates the app name and returns the new entity', async () => {
      const app = await ctx.interactor.create({ name: 'Old' });
      const updated = await ctx.interactor.update({ appId: app.id, name: 'New' });
      expect(updated.name).toBe('New');
      expect(updated.id).toBe(app.id);
    });

    it('preserves original name when no name is given in the update', async () => {
      const app = await ctx.interactor.create({ name: 'Stays' });
      const updated = await ctx.interactor.update({ appId: app.id });
      expect(updated.name).toBe('Stays');
    });

    it('allows updating to the same name (self-exclusion)', async () => {
      const app = await ctx.interactor.create({ name: 'Same' });
      const updated = await ctx.interactor.update({ appId: app.id, name: 'Same' });
      expect(updated.name).toBe('Same');
    });

    it('throws CONFLICT when the new name is taken by another app', async () => {
      await ctx.interactor.create({ name: 'Taken' });
      const app = await ctx.interactor.create({ name: 'Mine' });
      await expect(ctx.interactor.update({ appId: app.id, name: 'Taken' })).rejects.toMatchObject({
        code: 'CONFLICT',
      });
    });

    it('throws NOT_FOUND for an unknown app', async () => {
      await expect(
        ctx.interactor.update({ appId: GHOST_ID, name: 'X' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('soft-deletes the app and returns it with deletedAt set', async () => {
      const app = await ctx.interactor.create({ name: 'Del' });
      const deleted = await ctx.interactor.delete({ appId: app.id });
      expect(deleted.id).toBe(app.id);
      expect(deleted.deletedAt).not.toBeNull();
      expect(ISO_RE.test(deleted.deletedAt as string)).toBe(true);
    });

    it('deleted app is no longer in the list', async () => {
      const app = await ctx.interactor.create({ name: 'Del' });
      await ctx.interactor.delete({ appId: app.id });
      expect((await ctx.interactor.list()).find(a => a.id === app.id)).toBeUndefined();
    });

    it('cascade-deletes associated todos via shared repository', async () => {
      const app = await ctx.interactor.create({ name: 'Cascade' });
      const todo: TodoEntity = {
        id: 'todo-cascade',
        appId: app.id,
        title: 'Will be deleted',
        completed: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        deletedAt: null,
      };
      await ctx.todoRepository.save(todo);
      await ctx.interactor.delete({ appId: app.id });
      const foundTodo = await ctx.todoRepository.findActiveById(app.id, 'todo-cascade');
      expect(foundTodo).toBeNull();
    });

    it('throws NOT_FOUND for an unknown app', async () => {
      await expect(ctx.interactor.delete({ appId: GHOST_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });
});
