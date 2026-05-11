import { describe, it, expect } from 'vitest';

import type { TodoEntity } from '../../../models/todo';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';
import { createTodoInteractor } from '../../../services/todo-interactor';

const TIME = '2024-01-01T00:00:00.000Z';

describe('TodoEntity', () => {
  it('active entity has completed as false and deletedAt as null', () => {
    const todo: TodoEntity = {
      id: 'todo-1',
      appId: 'app-1',
      title: 'Test Todo',
      completed: false,
      createdAt: TIME,
      updatedAt: TIME,
      deletedAt: null,
    };
    expect(todo.completed).toBe(false);
    expect(todo.deletedAt).toBeNull();
  });

  it('completed entity has completed as true', () => {
    const todo: TodoEntity = {
      id: 'todo-1',
      appId: 'app-1',
      title: 'Done',
      completed: true,
      createdAt: TIME,
      updatedAt: TIME,
      deletedAt: null,
    };
    expect(todo.completed).toBe(true);
  });

  it('entity created by interactor has all TodoEntity fields with correct types', async () => {
    const storage = createInMemoryStorage();
    const appRepo = createInMemoryAppRepository(storage);
    const todoRepo = createInMemoryTodoRepository(storage);
    const appInteractor = createAppInteractor({ appRepository: appRepo, todoRepository: todoRepo });
    const todoInteractor = createTodoInteractor({ appRepository: appRepo, todoRepository: todoRepo });
    const app = await appInteractor.create({ name: 'Shape App' });
    const todo = await todoInteractor.create({ appId: app.id, title: 'Shape Todo' });
    expect(typeof todo.id).toBe('string');
    expect(todo.id.length).toBeGreaterThan(0);
    expect(todo.appId).toBe(app.id);
    expect(todo.title).toBe('Shape Todo');
    expect(todo.completed).toBe(false);
    expect(typeof todo.createdAt).toBe('string');
    expect(typeof todo.updatedAt).toBe('string');
    expect(todo.deletedAt).toBeNull();
  });

  it('soft-deleted entity returned by interactor has deletedAt set to a string', async () => {
    const storage = createInMemoryStorage();
    const appRepo = createInMemoryAppRepository(storage);
    const todoRepo = createInMemoryTodoRepository(storage);
    const appInteractor = createAppInteractor({ appRepository: appRepo, todoRepository: todoRepo });
    const todoInteractor = createTodoInteractor({ appRepository: appRepo, todoRepository: todoRepo });
    const app = await appInteractor.create({ name: 'Del Todo App' });
    const todo = await todoInteractor.create({ appId: app.id, title: 'Del Todo' });
    const deleted = await todoInteractor.delete({ appId: app.id, todoId: todo.id });
    expect(deleted.deletedAt).not.toBeNull();
    expect(typeof deleted.deletedAt).toBe('string');
  });

  it('entity is stored and retrieved with the same shape through the repository', async () => {
    const storage = createInMemoryStorage();
    const repo = createInMemoryTodoRepository(storage);
    const entity: TodoEntity = {
      id: 'todo-persist',
      appId: 'app-1',
      title: 'Persisted',
      completed: false,
      createdAt: TIME,
      updatedAt: TIME,
      deletedAt: null,
    };
    await repo.save(entity);
    const found = await repo.findActiveById('app-1', 'todo-persist');
    expect(found).toEqual(entity);
  });
});
