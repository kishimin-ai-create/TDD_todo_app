import { describe, expect, it, vi } from 'vitest';

import type { AppRepository } from '../repositories/app-repository';
import type { TodoRepository } from '../repositories/todo-repository';
import { createTodoInteractor } from './todo-interactor';

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

const FIXED_ID = 'todo-uuid-0000';
const FIXED_TIME = '2024-06-01T12:00:00.000Z';

const EXISTING_APP = {
  id: 'app-1',
  name: 'My App',
  createdAt: FIXED_TIME,
  updatedAt: FIXED_TIME,
  deletedAt: null,
};

function makeInteractor(
  appRepo: AppRepository,
  todoRepo: TodoRepository,
) {
  return createTodoInteractor({
    appRepository: appRepo,
    todoRepository: todoRepo,
    generateId: () => FIXED_ID,
    now: () => FIXED_TIME,
  });
}

// ─── create ──────────────────────────────────────────────────────────────────

describe('createTodoInteractor.create', () => {
  it('saves and returns a new todo entity', async () => {
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) });
    const todoRepo = makeTodoRepository();
    const interactor = makeInteractor(appRepo, todoRepo);

    const result = await interactor.create({ appId: 'app-1', title: 'My Todo' });

    expect(result).toEqual({
      id: FIXED_ID,
      appId: 'app-1',
      title: 'My Todo',
      completed: false,
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
      deletedAt: null,
    });
    expect(todoRepo.save).toHaveBeenCalledWith(result);
  });

  it('throws NOT_FOUND when the app does not exist', async () => {
    const interactor = makeInteractor(makeAppRepository(), makeTodoRepository());

    await expect(
      interactor.create({ appId: 'ghost-app', title: 'Orphan' }),
    ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
  });

  it('sets completed to false by default', async () => {
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    const result = await interactor.create({ appId: 'app-1', title: 'Default' });
    expect(result.completed).toBe(false);
  });
});

// ─── list ────────────────────────────────────────────────────────────────────

describe('createTodoInteractor.list', () => {
  it('returns the active todos for the given app', async () => {
    const todos = [
      { id: 't1', appId: 'app-1', title: 'T1', completed: false, createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null },
    ];
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) });
    const todoRepo = makeTodoRepository({ listActiveByAppId: vi.fn().mockResolvedValue(todos) });
    const interactor = makeInteractor(appRepo, todoRepo);

    const result = await interactor.list({ appId: 'app-1' });

    expect(result).toEqual(todos);
  });

  it('throws NOT_FOUND when the app does not exist', async () => {
    const interactor = makeInteractor(makeAppRepository(), makeTodoRepository());

    await expect(interactor.list({ appId: 'ghost' })).rejects.toThrow(
      expect.objectContaining({ code: 'NOT_FOUND' }),
    );
  });
});

// ─── get ─────────────────────────────────────────────────────────────────────

describe('createTodoInteractor.get', () => {
  it('returns the todo when found', async () => {
    const todo = { id: 'todo-1', appId: 'app-1', title: 'T1', completed: false, createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) });
    const todoRepo = makeTodoRepository({ findActiveById: vi.fn().mockResolvedValue(todo) });
    const interactor = makeInteractor(appRepo, todoRepo);

    const result = await interactor.get({ appId: 'app-1', todoId: 'todo-1' });
    expect(result).toEqual(todo);
  });

  it('throws NOT_FOUND when the todo does not exist', async () => {
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    await expect(
      interactor.get({ appId: 'app-1', todoId: 'ghost-todo' }),
    ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
  });

  it('throws NOT_FOUND when the app does not exist', async () => {
    const interactor = makeInteractor(makeAppRepository(), makeTodoRepository());

    await expect(
      interactor.get({ appId: 'ghost', todoId: 'any' }),
    ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('createTodoInteractor.update', () => {
  it('saves and returns the todo with updated title', async () => {
    const todo = { id: 'todo-1', appId: 'app-1', title: 'Old', completed: false, createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) });
    const todoRepo = makeTodoRepository({ findActiveById: vi.fn().mockResolvedValue(todo) });
    const interactor = makeInteractor(appRepo, todoRepo);

    const result = await interactor.update({ appId: 'app-1', todoId: 'todo-1', title: 'New' });

    expect(result.title).toBe('New');
    expect(todoRepo.save).toHaveBeenCalledWith(result);
  });

  it('updates completed status', async () => {
    const todo = { id: 'todo-1', appId: 'app-1', title: 'T', completed: false, createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) });
    const todoRepo = makeTodoRepository({ findActiveById: vi.fn().mockResolvedValue(todo) });
    const interactor = makeInteractor(appRepo, todoRepo);

    const result = await interactor.update({ appId: 'app-1', todoId: 'todo-1', completed: true });
    expect(result.completed).toBe(true);
  });

  it('preserves original values when no update fields are provided', async () => {
    const todo = { id: 'todo-1', appId: 'app-1', title: 'Same', completed: true, createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) });
    const todoRepo = makeTodoRepository({ findActiveById: vi.fn().mockResolvedValue(todo) });
    const interactor = makeInteractor(appRepo, todoRepo);

    const result = await interactor.update({ appId: 'app-1', todoId: 'todo-1' });
    expect(result.title).toBe('Same');
    expect(result.completed).toBe(true);
  });

  it('throws NOT_FOUND when the todo does not exist', async () => {
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    await expect(
      interactor.update({ appId: 'app-1', todoId: 'ghost', title: 'X' }),
    ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
  });

  it('throws NOT_FOUND when the app does not exist', async () => {
    const interactor = makeInteractor(makeAppRepository(), makeTodoRepository());

    await expect(
      interactor.update({ appId: 'ghost', todoId: 'any', title: 'X' }),
    ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
  });
});

// ─── delete ──────────────────────────────────────────────────────────────────

describe('createTodoInteractor.delete', () => {
  it('marks the todo as deleted and returns it', async () => {
    const todo = { id: 'todo-1', appId: 'app-1', title: 'Bye', completed: false, createdAt: FIXED_TIME, updatedAt: FIXED_TIME, deletedAt: null };
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) });
    const todoRepo = makeTodoRepository({ findActiveById: vi.fn().mockResolvedValue(todo) });
    const interactor = makeInteractor(appRepo, todoRepo);

    const result = await interactor.delete({ appId: 'app-1', todoId: 'todo-1' });

    expect(result.deletedAt).toBe(FIXED_TIME);
    expect(todoRepo.save).toHaveBeenCalledWith(result);
  });

  it('throws NOT_FOUND when the todo does not exist', async () => {
    const appRepo = makeAppRepository({ findActiveById: vi.fn().mockResolvedValue(EXISTING_APP) });
    const interactor = makeInteractor(appRepo, makeTodoRepository());

    await expect(
      interactor.delete({ appId: 'app-1', todoId: 'ghost' }),
    ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
  });

  it('throws NOT_FOUND when the app does not exist', async () => {
    const interactor = makeInteractor(makeAppRepository(), makeTodoRepository());

    await expect(
      interactor.delete({ appId: 'ghost', todoId: 'any' }),
    ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
  });
});
