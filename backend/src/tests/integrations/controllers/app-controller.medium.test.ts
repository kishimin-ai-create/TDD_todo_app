import { describe, it, expect, beforeEach } from 'vitest';

import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';
import { createAppController } from '../../../controllers/app-controller';

const GHOST_ID = '00000000-0000-0000-0000-000000000000';

function setup() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const interactor = createAppInteractor({ appRepository, todoRepository });
  const controller = createAppController(interactor);
  return { controller, interactor };
}

describe('AppController integration', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('returns 201 with success:true and app DTO on valid input', async () => {
      const res = await ctx.controller.create({ name: 'My App' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        id: expect.any(String),
        name: 'My App',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('DTO does not include deletedAt', async () => {
      const res = await ctx.controller.create({ name: 'App' });
      expect(res.body.data).not.toHaveProperty('deletedAt');
    });

    it('returns 422 when name is missing', async () => {
      const res = await ctx.controller.create({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    });

    it('returns 422 when name is not a string', async () => {
      const res = await ctx.controller.create({ name: 42 });
      expect(res.status).toBe(422);
      expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    });

    it('returns 422 when name is an empty string', async () => {
      const res = await ctx.controller.create({ name: '   ' });
      expect(res.status).toBe(422);
    });

    it('returns 409 when the name is already taken', async () => {
      await ctx.controller.create({ name: 'Dup' });
      const res = await ctx.controller.create({ name: 'Dup' });
      expect(res.status).toBe(409);
      expect(res.body.error?.code).toBe('CONFLICT');
    });

    it('returns 422 when body is null', async () => {
      const res = await ctx.controller.create(null);
      expect(res.status).toBe(422);
    });
  });

  // ─── list ────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns 200 with an empty array when no apps exist', async () => {
      const res = await ctx.controller.list();
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('returns 200 with all created apps', async () => {
      await ctx.controller.create({ name: 'A' });
      await ctx.controller.create({ name: 'B' });
      const res = await ctx.controller.list();
      expect(res.status).toBe(200);
      expect((res.body.data as unknown[]).length).toBe(2);
    });
  });

  // ─── get ─────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('returns 200 with the correct app', async () => {
      const created = await ctx.controller.create({ name: 'Get App' });
      const appId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.get(appId);
      expect(res.status).toBe(200);
      expect((res.body.data as { id: string }).id).toBe(appId);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await ctx.controller.get(GHOST_ID);
      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe('NOT_FOUND');
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('returns 200 with the updated app', async () => {
      const created = await ctx.controller.create({ name: 'Old' });
      const appId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.update(appId, { name: 'New' });
      expect(res.status).toBe(200);
      expect((res.body.data as { name: string }).name).toBe('New');
    });

    it('returns 422 when updated name is empty', async () => {
      const created = await ctx.controller.create({ name: 'Valid' });
      const appId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.update(appId, { name: '' });
      expect(res.status).toBe(422);
    });

    it('returns 409 when the new name conflicts', async () => {
      await ctx.controller.create({ name: 'Taken' });
      const other = await ctx.controller.create({ name: 'Mine' });
      const otherId = (other.body.data as { id: string }).id;
      const res = await ctx.controller.update(otherId, { name: 'Taken' });
      expect(res.status).toBe(409);
    });

    it('returns 404 for an unknown app id', async () => {
      const res = await ctx.controller.update(GHOST_ID, { name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('returns 200 with the soft-deleted app', async () => {
      const created = await ctx.controller.create({ name: 'Del' });
      const appId = (created.body.data as { id: string }).id;
      const res = await ctx.controller.delete(appId);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for an unknown app id', async () => {
      const res = await ctx.controller.delete(GHOST_ID);
      expect(res.status).toBe(404);
    });
  });
});
