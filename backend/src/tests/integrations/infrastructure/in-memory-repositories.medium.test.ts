import { describe, it, expect } from 'vitest';

import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import type { AppEntity } from '../../../models/app';
import type { TodoEntity } from '../../../models/todo';

function makeApp(id: string, name: string, deleted = false): AppEntity {
  return {
    id,
    name,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: deleted ? '2024-01-02T00:00:00.000Z' : null,
  };
}

function makeTodo(id: string, appId: string, title: string, deleted = false): TodoEntity {
  return {
    id,
    appId,
    title,
    completed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: deleted ? '2024-01-02T00:00:00.000Z' : null,
  };
}

describe('InMemoryRepositories cross-repo integration', () => {
  describe('shared storage between app and todo repos', () => {
    it('save in appRepo and retrieve from the same storage', async () => {
      const storage = createInMemoryStorage();
      const appRepo = createInMemoryAppRepository(storage);
      const app = makeApp('a1', 'App');
      await appRepo.save(app);
      expect(storage.apps.size).toBe(1);
      expect(storage.apps.get('a1')?.name).toBe('App');
    });

    it('save in todoRepo and retrieve from the same storage', async () => {
      const storage = createInMemoryStorage();
      const todoRepo = createInMemoryTodoRepository(storage);
      const todo = makeTodo('t1', 'a1', 'Todo');
      await todoRepo.save(todo);
      expect(storage.todos.size).toBe(1);
      expect(storage.todos.get('t1')?.title).toBe('Todo');
    });

    it('both repos share the same storage instance (app deletion visible to todoRepo)', async () => {
      const storage = createInMemoryStorage();
      const appRepo = createInMemoryAppRepository(storage);
      const todoRepo = createInMemoryTodoRepository(storage);
      const app = makeApp('a1', 'App');
      await appRepo.save(app);
      await todoRepo.save(makeTodo('t1', 'a1', 'T1'));
      await todoRepo.save(makeTodo('t2', 'a1', 'T2'));
      expect(await todoRepo.listActiveByAppId('a1')).toHaveLength(2);
      const deletedApp = { ...app, deletedAt: '2024-01-02T00:00:00.000Z' };
      await appRepo.save(deletedApp);
      const todos = await todoRepo.listActiveByAppId('a1');
      expect(todos).toHaveLength(2);
    });

    it('storage.clear() resets both repos at once', async () => {
      const storage = createInMemoryStorage();
      const appRepo = createInMemoryAppRepository(storage);
      const todoRepo = createInMemoryTodoRepository(storage);
      await appRepo.save(makeApp('a1', 'App'));
      await todoRepo.save(makeTodo('t1', 'a1', 'Todo'));
      storage.clear();
      expect(await appRepo.listActive()).toHaveLength(0);
      expect(await todoRepo.listActiveByAppId('a1')).toHaveLength(0);
    });
  });

  describe('separate storage instances are isolated', () => {
    it('two separate storages do not share data', async () => {
      const storage1 = createInMemoryStorage();
      const storage2 = createInMemoryStorage();
      const repo1 = createInMemoryAppRepository(storage1);
      const repo2 = createInMemoryAppRepository(storage2);
      await repo1.save(makeApp('a1', 'App 1'));
      expect(await repo2.listActive()).toHaveLength(0);
    });
  });

  describe('app repo cross-repo cascade scenario', () => {
    it('manual cascade: soft-deleting todos after app delete removes them from active list', async () => {
      const storage = createInMemoryStorage();
      const appRepo = createInMemoryAppRepository(storage);
      const todoRepo = createInMemoryTodoRepository(storage);
      const app = makeApp('a1', 'App');
      await appRepo.save(app);
      const todo = makeTodo('t1', 'a1', 'T1');
      await todoRepo.save(todo);
      const deletedTodo = { ...todo, deletedAt: '2024-01-02T00:00:00.000Z' };
      await todoRepo.save(deletedTodo);
      expect(await todoRepo.findActiveById('a1', 't1')).toBeNull();
    });

    it('todos from one app are invisible to another app', async () => {
      const storage = createInMemoryStorage();
      const todoRepo = createInMemoryTodoRepository(storage);
      await todoRepo.save(makeTodo('t1', 'app-a', 'T for A'));
      await todoRepo.save(makeTodo('t2', 'app-b', 'T for B'));
      const todosA = await todoRepo.listActiveByAppId('app-a');
      const todosB = await todoRepo.listActiveByAppId('app-b');
      expect(todosA).toHaveLength(1);
      expect(todosB).toHaveLength(1);
      expect(todosA[0].id).toBe('t1');
      expect(todosB[0].id).toBe('t2');
    });
  });

  describe('repository returns clones (no mutation through returned reference)', () => {
    it('mutating a returned app entity does not affect stored data', async () => {
      const storage = createInMemoryStorage();
      const appRepo = createInMemoryAppRepository(storage);
      await appRepo.save(makeApp('a1', 'Original'));
      const found = await appRepo.findActiveById('a1');
      if (found) found.name = 'Mutated';
      const found2 = await appRepo.findActiveById('a1');
      expect(found2?.name).toBe('Original');
    });

    it('mutating a returned todo entity does not affect stored data', async () => {
      const storage = createInMemoryStorage();
      const todoRepo = createInMemoryTodoRepository(storage);
      await todoRepo.save(makeTodo('t1', 'a1', 'Original Title'));
      const found = await todoRepo.findActiveById('a1', 't1');
      if (found) found.title = 'Mutated';
      const found2 = await todoRepo.findActiveById('a1', 't1');
      expect(found2?.title).toBe('Original Title');
    });
  });
});
