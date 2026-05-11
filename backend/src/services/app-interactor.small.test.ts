import { describe, expect, it, vi } from 'vitest';

import type { AppRepository } from '../repositories/app-repository';
import type { TodoRepository } from '../repositories/todo-repository';
import { createAppInteractor } from './app-interactor';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAppRepository(
  overrides: Partial<AppRepository> = {},
): AppRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    listActive: vi.fn().mockResolvedValue([]),
    findActiveById: vi.fn().mockResolvedValue(null),
    existsActiveByName: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

function makeTodoRepository(
  overrides: Partial<TodoRepository> = {},
): TodoRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    listActiveByAppId: vi.fn().mockResolvedValue([]),
    findActiveById: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

const FIXED_ID = 'test-uuid-0000';
const FIXED_TIME = '2024-06-01T12:00:00.000Z';

function makeInteractor(
  appRepo: AppRepository,
  todoRepo: TodoRepository,
) {
  return createAppInteractor({
    appRepository: appRepo,
    todoRepository: todoRepo,
    generateId: () => FIXED_ID,
    now: () => FIXED_TIME,
  });
}

// ─── create ──────────────────────────────────────────────────────────────────

describe('createAppInteractor.create', () => {
  it('saves and returns a new app entity', async () => {
    const appRepo = makeAppRepository();
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    const result = await interactor.create({ name: 'My App' });

    expect(result).toEqual({
      id: FIXED_ID,
      name: 'My App',
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
      deletedAt: null,
    });
    expect(appRepo.save).toHaveBeenCalledWith(result);
  });

  it('throws CONFLICT when app name already exists', async () => {
    const appRepo = makeAppRepository({
      existsActiveByName: vi.fn().mockResolvedValue(true),
    });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    await expect(interactor.create({ name: 'Existing' })).rejects.toThrow(
      expect.objectContaining({ code: 'CONFLICT' }),
    );
  });

  it('does not call save when duplicate is detected', async () => {
    const appRepo = makeAppRepository({
      existsActiveByName: vi.fn().mockResolvedValue(true),
    });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    await expect(interactor.create({ name: 'Existing' })).rejects.toThrow();
    expect(appRepo.save).not.toHaveBeenCalled();
  });
});

// ─── list ────────────────────────────────────────────────────────────────────

describe('createAppInteractor.list', () => {
  it('returns the list of active apps from the repository', async () => {
    const apps = [
      { id: '1', name: 'A', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null },
    ];
    const appRepo = makeAppRepository({ listActive: vi.fn().mockResolvedValue(apps) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    const result = await interactor.list();

    expect(result).toEqual(apps);
  });

  it('returns an empty array when no apps exist', async () => {
    const interactor = makeInteractor(makeAppRepository(), makeTodoRepository());
    const result = await interactor.list();
    expect(result).toEqual([]);
  });
});

// ─── get ─────────────────────────────────────────────────────────────────────

describe('createAppInteractor.get', () => {
  it('returns the app when found', async () => {
    const app = { id: 'app-1', name: 'Found', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(app) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    const result = await interactor.get({ appId: 'app-1' });

    expect(result).toEqual(app);
  });

  it('throws NOT_FOUND when app does not exist', async () => {
    const interactor = makeInteractor(makeAppRepository(), makeTodoRepository());

    await expect(interactor.get({ appId: 'ghost' })).rejects.toThrow(
      expect.objectContaining({ code: 'NOT_FOUND' }),
    );
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('createAppInteractor.update', () => {
  it('saves and returns the updated app entity', async () => {
    const existing = { id: 'app-1', name: 'Old', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(existing) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    const result = await interactor.update({ appId: 'app-1', name: 'New' });

    expect(result.name).toBe('New');
    expect(result.updatedAt).toBe(FIXED_TIME);
    expect(appRepo.save).toHaveBeenCalledWith(result);
  });

  it('keeps original name when name is not provided in the update', async () => {
    const existing = { id: 'app-1', name: 'Original', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(existing) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    const result = await interactor.update({ appId: 'app-1' });

    expect(result.name).toBe('Original');
  });

  it('throws NOT_FOUND when app does not exist', async () => {
    const interactor = makeInteractor(makeAppRepository(), makeTodoRepository());

    await expect(interactor.update({ appId: 'ghost', name: 'X' })).rejects.toThrow(
      expect.objectContaining({ code: 'NOT_FOUND' }),
    );
  });

  it('throws CONFLICT when new name is already taken by a different app', async () => {
    const existing = { id: 'app-1', name: 'Original', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({
      findActiveById: vi.fn().mockResolvedValue(existing),
      existsActiveByName: vi.fn().mockResolvedValue(true),
    });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    await expect(interactor.update({ appId: 'app-1', name: 'Taken' })).rejects.toThrow(
      expect.objectContaining({ code: 'CONFLICT' }),
    );
  });
});

// ─── delete ──────────────────────────────────────────────────────────────────

describe('createAppInteractor.delete', () => {
  it('marks the app as deleted and returns it', async () => {
    const existing = { id: 'app-1', name: 'ToDelete', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(existing) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    const result = await interactor.delete({ appId: 'app-1' });

    expect(result.deletedAt).toBe(FIXED_TIME);
    expect(result.id).toBe('app-1');
  });

  it('saves the deleted app to the repository', async () => {
    const existing = { id: 'app-1', name: 'ToDelete', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(existing) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    const result = await interactor.delete({ appId: 'app-1' });
    expect(appRepo.save).toHaveBeenCalledWith(result);
  });

  it('cascade-deletes all active todos belonging to the app', async () => {
    const existing = { id: 'app-1', name: 'Cascader', createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const todos = [
      { id: 'todo-1', appId: 'app-1', title: 'T1', completed: false, createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null },
      { id: 'todo-2', appId: 'app-1', title: 'T2', completed: false, createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null },
    ];
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(existing) });
    const todoRepo = makeTodoRepository({
      listActiveByAppId: vi.fn().mockResolvedValue(todos),
    });
    const interactor = makeInteractor(appRepo, todoRepo);

    await interactor.delete({ appId: 'app-1' });

    expect(todoRepo.save).toHaveBeenCalledTimes(2);
    expect(todoRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'todo-1', deletedAt: FIXED_TIME }));
    expect(todoRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'todo-2', deletedAt: FIXED_TIME }));
  });

  it('throws NOT_FOUND when app does not exist', async () => {
    const interactor = makeInteractor(makeAppRepository(), makeTodoRepository());

    await expect(interactor.delete({ appId: 'ghost' })).rejects.toThrow(
      expect.objectContaining({ code: 'NOT_FOUND' }),
    );
  });
});
