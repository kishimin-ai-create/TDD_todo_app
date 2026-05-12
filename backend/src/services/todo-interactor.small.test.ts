import { describe, it, expect, vi } from 'vitest';

import type { AppRepository } from '../repositories/app-repository';
import type { TodoRepository } from '../repositories/todo-repository';
import { createTodoInteractor } from './todo-interactor';

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';
const FIXED_ID = 'todo-uuid-0000';
const FIXED_TIME = '2024-06-01T12:00:00.000Z';

const EXISTING_APP = {
  id: 'app-1',
  userId: USER_ID,
  name: 'My App',
  createdAt: FIXED_TIME,
  updatedAt: FIXED_TIME,
  deletedAt: null,
};

function makeAppRepository(overrides: Partial<AppRepository> = {}): AppRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    listActiveByUserId: vi.fn().mockResolvedValue([]),
    findActiveById: vi.fn().mockResolvedValue(null),
    existsActiveByName: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

function makeTodoRepository(overrides: Partial<TodoRepository> = {}): TodoRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    listActiveByAppId: vi.fn().mockResolvedValue([]),
    findActiveById: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function makeInteractor(appRepo: AppRepository, todoRepo: TodoRepository) {
  return createTodoInteractor({
    appRepository: appRepo,
    todoRepository: todoRepo,
    generateId: () => FIXED_ID,
    now: () => FIXED_TIME,
  });
}

describe('createTodoInteractor', () => {
  it('creates a todo for the owner app', async () => {
    const interactor = makeInteractor(
      makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) }),
      makeTodoRepository(),
    );

    const result = await interactor.create({ appId: 'app-1', title: 'My Todo', userId: USER_ID });

    expect(result).toEqual({
      id: FIXED_ID,
      appId: 'app-1',
      title: 'My Todo',
      completed: false,
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
      deletedAt: null,
    });
  });

  it('forbids access to another user app', async () => {
    const interactor = makeInteractor(
      makeAppRepository({ findActiveById: vi.fn().mockResolvedValue({ ...EXISTING_APP, userId: OTHER_USER_ID }) }),
      makeTodoRepository(),
    );

    await expect(interactor.list({ appId: 'app-1', userId: USER_ID })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('updates a todo for the owner', async () => {
    const todo = { id: 'todo-1', appId: 'app-1', title: 'Old', completed: false, createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const interactor = makeInteractor(
      makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) }),
      makeTodoRepository({ findActiveById: vi.fn().mockResolvedValue(todo) }),
    );

    const updated = await interactor.update({ appId: 'app-1', todoId: 'todo-1', userId: USER_ID, title: 'New' });
    expect(updated.title).toBe('New');
  });

  it('deletes a todo for the owner', async () => {
    const todo = { id: 'todo-1', appId: 'app-1', title: 'Bye', completed: false, createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const todoRepo = makeTodoRepository({ findActiveById: vi.fn().mockResolvedValue(todo) });
    const interactor = makeInteractor(
      makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) }),
      todoRepo,
    );

    const deleted = await interactor.delete({ appId: 'app-1', todoId: 'todo-1', userId: USER_ID });
    expect(deleted.deletedAt).toBe(FIXED_TIME);
    expect(todoRepo.save).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: FIXED_TIME }));
  });
});
