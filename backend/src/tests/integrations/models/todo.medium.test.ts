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
const USER_ID = 'user-1';

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

  it('entity created and deleted by interactors keeps TodoEntity shape', async () => {
    const storage = createInMemoryStorage();
    const appRepo = createInMemoryAppRepository(storage);
    const todoRepo = createInMemoryTodoRepository(storage);
    const appInteractor = createAppInteractor({ appRepository: appRepo, todoRepository: todoRepo });
    const todoInteractor = createTodoInteractor({ appRepository: appRepo, todoRepository: todoRepo });
    const app = await appInteractor.create({ name: 'Shape App', userId: USER_ID });
    const todo = await todoInteractor.create({ appId: app.id, title: 'Shape Todo', userId: USER_ID });
    expect(todo.completed).toBe(false);
    const deleted = await todoInteractor.delete({ appId: app.id, todoId: todo.id, userId: USER_ID });
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
