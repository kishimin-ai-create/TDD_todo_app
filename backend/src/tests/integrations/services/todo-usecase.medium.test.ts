import { describe, it, expect } from 'vitest';

import { createAppInteractor } from '../../../services/app-interactor';
import { createTodoInteractor } from '../../../services/todo-interactor';
import type { TodoUsecase } from '../../../services/todo-usecase';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';

function makeUsecase() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const appInteractor = createAppInteractor({ appRepository, todoRepository });
  const usecase: TodoUsecase = createTodoInteractor({ appRepository, todoRepository });
  return { appInteractor, usecase };
}

describe('TodoUsecase interface contract', () => {
  it('createTodoInteractor satisfies the TodoUsecase interface', () => {
    const { usecase } = makeUsecase();
    expect(typeof usecase.create).toBe('function');
    expect(typeof usecase.list).toBe('function');
    expect(typeof usecase.get).toBe('function');
    expect(typeof usecase.update).toBe('function');
    expect(typeof usecase.delete).toBe('function');
  });

  it('create resolves to a TodoEntity shape', async () => {
    const { appInteractor, usecase } = makeUsecase();
    const app = await appInteractor.create({ name: 'Contract App' });
    const todo = await usecase.create({ appId: app.id, title: 'Contract Todo' });
    expect(todo).toMatchObject({
      id: expect.any(String),
      appId: app.id,
      title: 'Contract Todo',
      completed: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
  });

  it('list resolves to an array', async () => {
    const { appInteractor, usecase } = makeUsecase();
    const app = await appInteractor.create({ name: 'List Contract App' });
    const result = await usecase.list({ appId: app.id });
    expect(Array.isArray(result)).toBe(true);
  });

  it('get resolves to the todo by appId and todoId', async () => {
    const { appInteractor, usecase } = makeUsecase();
    const app = await appInteractor.create({ name: 'Get Contract App' });
    const created = await usecase.create({ appId: app.id, title: 'Get Contract' });
    const found = await usecase.get({ appId: app.id, todoId: created.id });
    expect(found.id).toBe(created.id);
  });

  it('update resolves to the modified todo', async () => {
    const { appInteractor, usecase } = makeUsecase();
    const app = await appInteractor.create({ name: 'Update Contract App' });
    const created = await usecase.create({ appId: app.id, title: 'Original' });
    const updated = await usecase.update({ appId: app.id, todoId: created.id, title: 'Updated' });
    expect(updated.title).toBe('Updated');
  });

  it('delete resolves to the soft-deleted todo', async () => {
    const { appInteractor, usecase } = makeUsecase();
    const app = await appInteractor.create({ name: 'Del Contract App' });
    const created = await usecase.create({ appId: app.id, title: 'To Delete' });
    const deleted = await usecase.delete({ appId: app.id, todoId: created.id });
    expect(deleted.deletedAt).not.toBeNull();
  });
});
