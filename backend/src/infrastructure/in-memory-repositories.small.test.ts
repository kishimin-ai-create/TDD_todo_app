import { describe, expect, it, beforeEach } from 'vitest';

import { AppError } from '../models/app-error';
import type { AppEntity } from '../models/app';
import type { TodoEntity } from '../models/todo';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from './in-memory-repositories';
import { createInMemoryStorage } from './in-memory-storage';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TIME = '2024-01-01T00:00:00.000Z';

function makeApp(overrides: Partial<AppEntity> = {}): AppEntity {
  return {
    id: 'app-1',
    name: 'Test App',
    createdAt: TIME,
    updatedAt: TIME,
    deletedAt: null,
    ...overrides,
  };
}

function makeTodo(overrides: Partial<TodoEntity> = {}): TodoEntity {
  return {
    id: 'todo-1',
    appId: 'app-1',
    title: 'Test Todo',
    completed: false,
    createdAt: TIME,
    updatedAt: TIME,
    deletedAt: null,
    ...overrides,
  };
}

// ─── InMemoryAppRepository ───────────────────────────────────────────────────

describe('createInMemoryAppRepository', () => {
  let storage = createInMemoryStorage();
  let repo = createInMemoryAppRepository(storage);

  beforeEach(() => {
    storage = createInMemoryStorage();
    repo = createInMemoryAppRepository(storage);
  });

  describe('save / findActiveById', () => {
    it('stores and retrieves an app by id', async () => {
      const app = makeApp();
      await repo.save(app);
      const found = await repo.findActiveById(app.id);
      expect(found).toEqual(app);
    });

    it('returns null for an unknown id', async () => {
      const found = await repo.findActiveById('unknown');
      expect(found).toBeNull();
    });

    it('returns null for a soft-deleted app', async () => {
      const app = makeApp({ deletedAt: TIME });
      await repo.save(app);
      const found = await repo.findActiveById(app.id);
      expect(found).toBeNull();
    });

    it('returns a copy, not the original reference', async () => {
      const app = makeApp();
      await repo.save(app);
      const found = await repo.findActiveById(app.id);
      expect(found).not.toBe(app);
    });

    it('overwrites the app on repeated saves', async () => {
      const app = makeApp();
      await repo.save(app);
      const updated = { ...app, name: 'Updated' };
      await repo.save(updated);
      const found = await repo.findActiveById(app.id);
      expect(found?.name).toBe('Updated');
    });
  });

  describe('listActive', () => {
    it('returns all active (non-deleted) apps', async () => {
      await repo.save(makeApp({ id: 'app-1', name: 'A' }));
      await repo.save(makeApp({ id: 'app-2', name: 'B' }));
      const list = await repo.listActive();
      expect(list).toHaveLength(2);
    });

    it('excludes soft-deleted apps', async () => {
      await repo.save(makeApp({ id: 'app-1', name: 'Active' }));
      await repo.save(makeApp({ id: 'app-2', name: 'Deleted', deletedAt: TIME }));
      const list = await repo.listActive();
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Active');
    });

    it('returns an empty array when no apps exist', async () => {
      const list = await repo.listActive();
      expect(list).toEqual([]);
    });
  });

  describe('existsActiveByName', () => {
    it('returns true when an active app with the name exists', async () => {
      await repo.save(makeApp({ name: 'My App' }));
      const exists = await repo.existsActiveByName('My App');
      expect(exists).toBe(true);
    });

    it('returns false when no app with the name exists', async () => {
      const exists = await repo.existsActiveByName('Nonexistent');
      expect(exists).toBe(false);
    });

    it('returns false for a soft-deleted app with the same name', async () => {
      await repo.save(makeApp({ name: 'Gone', deletedAt: TIME }));
      const exists = await repo.existsActiveByName('Gone');
      expect(exists).toBe(false);
    });

    it('returns false when the only match is the excluded id', async () => {
      await repo.save(makeApp({ id: 'app-1', name: 'Same Name' }));
      const exists = await repo.existsActiveByName('Same Name', 'app-1');
      expect(exists).toBe(false);
    });

    it('returns true when another app has the same name (excluding self)', async () => {
      await repo.save(makeApp({ id: 'app-1', name: 'Shared' }));
      await repo.save(makeApp({ id: 'app-2', name: 'Shared' }));
      const exists = await repo.existsActiveByName('Shared', 'app-1');
      expect(exists).toBe(true);
    });
  });
});

// ─── InMemoryTodoRepository ──────────────────────────────────────────────────

describe('createInMemoryTodoRepository', () => {
  let storage = createInMemoryStorage();
  let repo = createInMemoryTodoRepository(storage);

  beforeEach(() => {
    storage = createInMemoryStorage();
    repo = createInMemoryTodoRepository(storage);
  });

  describe('save / findActiveById', () => {
    it('stores and retrieves a todo by appId and todoId', async () => {
      const todo = makeTodo();
      await repo.save(todo);
      const found = await repo.findActiveById(todo.appId, todo.id);
      expect(found).toEqual(todo);
    });

    it('returns null for an unknown todo id', async () => {
      await repo.save(makeTodo());
      const found = await repo.findActiveById('app-1', 'unknown-todo');
      expect(found).toBeNull();
    });

    it('returns null when appId does not match', async () => {
      await repo.save(makeTodo({ appId: 'app-1' }));
      const found = await repo.findActiveById('app-2', 'todo-1');
      expect(found).toBeNull();
    });

    it('returns null for a soft-deleted todo', async () => {
      await repo.save(makeTodo({ deletedAt: TIME }));
      const found = await repo.findActiveById('app-1', 'todo-1');
      expect(found).toBeNull();
    });

    it('returns a copy, not the original reference', async () => {
      const todo = makeTodo();
      await repo.save(todo);
      const found = await repo.findActiveById(todo.appId, todo.id);
      expect(found).not.toBe(todo);
    });
  });

  describe('listActiveByAppId', () => {
    it('returns active todos for the given appId', async () => {
      await repo.save(makeTodo({ id: 'todo-1', appId: 'app-1', title: 'T1' }));
      await repo.save(makeTodo({ id: 'todo-2', appId: 'app-1', title: 'T2' }));
      const list = await repo.listActiveByAppId('app-1');
      expect(list).toHaveLength(2);
    });

    it('excludes todos from a different app', async () => {
      await repo.save(makeTodo({ id: 'todo-1', appId: 'app-1' }));
      await repo.save(makeTodo({ id: 'todo-2', appId: 'app-2' }));
      const list = await repo.listActiveByAppId('app-1');
      expect(list).toHaveLength(1);
    });

    it('excludes soft-deleted todos', async () => {
      await repo.save(makeTodo({ id: 'todo-1', appId: 'app-1', deletedAt: TIME }));
      await repo.save(makeTodo({ id: 'todo-2', appId: 'app-1' }));
      const list = await repo.listActiveByAppId('app-1');
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('todo-2');
    });

    it('returns an empty array when no todos exist for the appId', async () => {
      const list = await repo.listActiveByAppId('app-1');
      expect(list).toEqual([]);
    });
  });

  describe('REPOSITORY_ERROR wrapping', () => {
    it('save on a corrupted storage wraps the error as AppError', async () => {
      const brokenStorage = createInMemoryStorage();
      Object.defineProperty(brokenStorage, 'todos', {
        get() { throw new Error('storage broken'); },
      });
      const brokenRepo = createInMemoryTodoRepository(brokenStorage);

      await expect(brokenRepo.save(makeTodo())).rejects.toBeInstanceOf(AppError);
      await expect(brokenRepo.save(makeTodo())).rejects.toMatchObject({
        code: 'REPOSITORY_ERROR',
      });
    });
  });
});
