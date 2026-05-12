import { describe, expect, it, vi } from 'vitest';

import type { AppRepository } from '../repositories/app-repository';
import type { TodoRepository } from '../repositories/todo-repository';
import { createAppInteractor } from './app-interactor';

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';
const FIXED_ID = 'test-uuid-0000';
const FIXED_TIME = '2024-06-01T12:00:00.000Z';

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
  return createAppInteractor({
    appRepository: appRepo,
    todoRepository: todoRepo,
    generateId: () => FIXED_ID,
    now: () => FIXED_TIME,
  });
}

describe('createAppInteractor', () => {
  it('creates an app with user ownership', async () => {
    const appRepo = makeAppRepository();
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    const result = await interactor.create({ name: 'My App', userId: USER_ID });

    expect(result).toEqual({
      id: FIXED_ID,
      userId: USER_ID,
      name: 'My App',
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
      deletedAt: null,
    });
    expect(appRepo.existsActiveByName).toHaveBeenCalledWith('My App', USER_ID);
  });

  it('lists apps for the current user', async () => {
    const appRepo = makeAppRepository({ listActiveByUserId: vi.fn().mockResolvedValue([{ id: '1', userId: USER_ID, name: 'A', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null }]) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    const result = await interactor.list(USER_ID);

    expect(result).toHaveLength(1);
    expect(appRepo.listActiveByUserId).toHaveBeenCalledWith(USER_ID);
  });

  it('forbids access to another user app', async () => {
    const appRepo = makeAppRepository({
      findActiveById: vi.fn().mockResolvedValue({ id: 'app-1', userId: OTHER_USER_ID, name: 'A', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null }),
    });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    await expect(interactor.get({ appId: 'app-1', userId: USER_ID })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('scopes duplicate-name checks to the owner during update', async () => {
    const existing = { id: 'app-1', userId: USER_ID, name: 'Old', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(existing) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    await interactor.update({ appId: 'app-1', userId: USER_ID, name: 'New' });

    expect(appRepo.existsActiveByName).toHaveBeenCalledWith('New', USER_ID, 'app-1');
  });

  it('cascade-deletes todos on delete', async () => {
    const existing = { id: 'app-1', userId: USER_ID, name: 'A', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const todoRepo = makeTodoRepository({ listActiveByAppId: vi.fn().mockResolvedValue([{ id: 'todo-1', appId: 'app-1', title: 'T1', completed: false, createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null }]) });
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(existing) });
    const interactor = makeInteractor(appRepo, todoRepo);

    const deleted = await interactor.delete({ appId: 'app-1', userId: USER_ID });

    expect(deleted.deletedAt).toBe(FIXED_TIME);
    expect(todoRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'todo-1', deletedAt: FIXED_TIME }));
  });
});
