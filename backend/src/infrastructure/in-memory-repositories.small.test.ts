import { describe, expect, it, beforeEach } from 'vitest';

import { AppError } from '../models/app-error';
import type { AppEntity } from '../models/app';
import type { TodoEntity } from '../models/todo';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from './in-memory-repositories';
import { createInMemoryStorage } from './in-memory-storage';

const TIME = '2024-01-01T00:00:00.000Z';

function makeApp(overrides: Partial<AppEntity> = {}): AppEntity {
  return {
    id: 'app-1',
    userId: 'user-1',
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

describe('createInMemoryAppRepository', () => {
  let storage = createInMemoryStorage();
  let repo = createInMemoryAppRepository(storage);

  beforeEach(() => {
    storage = createInMemoryStorage();
    repo = createInMemoryAppRepository(storage);
  });

  it('stores and retrieves apps by id', async () => {
    const app = makeApp();
    await repo.save(app);
    expect(await repo.findActiveById(app.id)).toEqual(app);
  });

  it('lists active apps by owner', async () => {
    await repo.save(makeApp({ id: 'app-1', userId: 'user-1', name: 'A' }));
    await repo.save(makeApp({ id: 'app-2', userId: 'user-2', name: 'B' }));
    expect(await repo.listActiveByUserId('user-1')).toHaveLength(1);
  });

  it('scopes duplicate name checks to the owner', async () => {
    await repo.save(makeApp({ id: 'app-1', userId: 'user-1', name: 'Shared' }));
    await repo.save(makeApp({ id: 'app-2', userId: 'user-2', name: 'Shared' }));
    expect(await repo.existsActiveByName('Shared', 'user-1')).toBe(true);
    expect(await repo.existsActiveByName('Shared', 'user-2')).toBe(true);
    expect(await repo.existsActiveByName('Shared', 'user-3')).toBe(false);
  });
});

describe('createInMemoryTodoRepository', () => {
  let storage = createInMemoryStorage();
  let repo = createInMemoryTodoRepository(storage);

  beforeEach(() => {
    storage = createInMemoryStorage();
    repo = createInMemoryTodoRepository(storage);
  });

  it('stores and retrieves a todo by appId and todoId', async () => {
    const todo = makeTodo();
    await repo.save(todo);
    expect(await repo.findActiveById(todo.appId, todo.id)).toEqual(todo);
  });

  it('lists active todos by appId', async () => {
    await repo.save(makeTodo({ id: 'todo-1', appId: 'app-1' }));
    await repo.save(makeTodo({ id: 'todo-2', appId: 'app-1' }));
    expect(await repo.listActiveByAppId('app-1')).toHaveLength(2);
  });

  it('wraps corrupted storage errors as AppError', async () => {
    const brokenStorage = createInMemoryStorage();
    Object.defineProperty(brokenStorage, 'todos', {
      get() {
        throw new Error('storage broken');
      },
    });
    const brokenRepo = createInMemoryTodoRepository(brokenStorage);
    await expect(brokenRepo.save(makeTodo())).rejects.toBeInstanceOf(AppError);
    await expect(brokenRepo.save(makeTodo())).rejects.toMatchObject({ code: 'REPOSITORY_ERROR' });
  });
});
