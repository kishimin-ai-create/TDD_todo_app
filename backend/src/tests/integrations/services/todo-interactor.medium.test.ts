import { describe, it, expect, beforeEach } from 'vitest';

import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';
import { createTodoInteractor } from '../../../services/todo-interactor';
import type { TodoUsecase } from '../../../services/todo-usecase';

const GHOST_APP_ID = '00000000-0000-0000-0000-000000000000';
const GHOST_TODO_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

function setup() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const appInteractor = createAppInteractor({ appRepository, todoRepository });
  const interactor: TodoUsecase = createTodoInteractor({ appRepository, todoRepository });
  return { appInteractor, interactor };
}

describe('TodoInteractor integration', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
  });

  it('creates and lists todos for the owner app', async () => {
    const app = await ctx.appInteractor.create({ name: 'App', userId: USER_ID });
    await ctx.interactor.create({ appId: app.id, title: 'My Todo', userId: USER_ID });
    expect(await ctx.interactor.list({ appId: app.id, userId: USER_ID })).toHaveLength(1);
  });

  it('forbids access to another user app todos', async () => {
    const app = await ctx.appInteractor.create({ name: 'App', userId: OTHER_USER_ID });
    await expect(ctx.interactor.list({ appId: app.id, userId: USER_ID })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('updates and deletes todos for the owner', async () => {
    const app = await ctx.appInteractor.create({ name: 'App', userId: USER_ID });
    const todo = await ctx.interactor.create({ appId: app.id, title: 'Old', userId: USER_ID });
    const updated = await ctx.interactor.update({ appId: app.id, todoId: todo.id, userId: USER_ID, completed: true });
    expect(updated.completed).toBe(true);
    const deleted = await ctx.interactor.delete({ appId: app.id, todoId: todo.id, userId: USER_ID });
    expect(deleted.deletedAt).not.toBeNull();
  });

  it('throws NOT_FOUND when the app does not exist', async () => {
    await expect(ctx.interactor.get({ appId: GHOST_APP_ID, todoId: GHOST_TODO_ID, userId: USER_ID })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
