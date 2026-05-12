import { describe, expect, it, beforeEach } from 'vitest';

import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';
import type { AppUsecase } from '../../../services/app-usecase';
import type { TodoEntity } from '../../../models/todo';

const GHOST_ID = '00000000-0000-0000-0000-000000000000';
const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

function setup() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const interactor: AppUsecase = createAppInteractor({ appRepository, todoRepository });
  return { todoRepository, interactor };
}

describe('AppInteractor integration', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
  });

  it('creates and lists apps per user', async () => {
    const app = await ctx.interactor.create({ name: 'My App', userId: USER_ID });
    await ctx.interactor.create({ name: 'Other App', userId: OTHER_USER_ID });
    expect(app.userId).toBe(USER_ID);
    expect(await ctx.interactor.list(USER_ID)).toHaveLength(1);
  });

  it('forbids reading another user app', async () => {
    const app = await ctx.interactor.create({ name: 'Foreign', userId: OTHER_USER_ID });
    await expect(ctx.interactor.get({ appId: app.id, userId: USER_ID })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('forbids updating another user app', async () => {
    const app = await ctx.interactor.create({ name: 'Foreign', userId: OTHER_USER_ID });
    await expect(ctx.interactor.update({ appId: app.id, userId: USER_ID, name: 'Nope' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('soft-deletes the app and cascades todos', async () => {
    const app = await ctx.interactor.create({ name: 'Cascade', userId: USER_ID });
    const todo: TodoEntity = {
      id: 'todo-cascade',
      appId: app.id,
      title: 'Will be deleted',
      completed: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      deletedAt: null,
    };
    await ctx.todoRepository.save(todo);
    await ctx.interactor.delete({ appId: app.id, userId: USER_ID });
    const foundTodo = await ctx.todoRepository.findActiveById(app.id, 'todo-cascade');
    expect(foundTodo).toBeNull();
  });

  it('throws NOT_FOUND for an unknown app', async () => {
    await expect(ctx.interactor.delete({ appId: GHOST_ID, userId: USER_ID })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
