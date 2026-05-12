import { describe, it, expect } from 'vitest';

import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';
import { createTodoInteractor } from '../../../services/todo-interactor';
import { presentApp, presentTodo } from '../../../controllers/http-presenter';

const USER_ID = 'user-1';

function setup() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const appInteractor = createAppInteractor({ appRepository, todoRepository });
  const todoInteractor = createTodoInteractor({ appRepository, todoRepository });
  return { appInteractor, todoInteractor };
}

describe('HttpPresenter integration', () => {
  it('presents real app entities without internal fields', async () => {
    const { appInteractor } = setup();
    const app = await appInteractor.create({ name: 'Presenter Test', userId: USER_ID });
    expect(presentApp(app)).toEqual({
      id: app.id,
      name: app.name,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    });
  });

  it('presents real todo entities without deletedAt', async () => {
    const { appInteractor, todoInteractor } = setup();
    const app = await appInteractor.create({ name: 'App For Todo', userId: USER_ID });
    const todo = await todoInteractor.create({ appId: app.id, title: 'My Todo', userId: USER_ID });
    expect(presentTodo(todo)).toEqual({
      id: todo.id,
      appId: todo.appId,
      title: todo.title,
      completed: todo.completed,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    });
  });

  it('reflects updated completed state from real entities', async () => {
    const { appInteractor, todoInteractor } = setup();
    const app = await appInteractor.create({ name: 'App', userId: USER_ID });
    const todo = await todoInteractor.create({ appId: app.id, title: 'Check', userId: USER_ID });
    const updated = await todoInteractor.update({ appId: app.id, todoId: todo.id, userId: USER_ID, completed: true });
    expect(presentTodo(updated).completed).toBe(true);
  });
});
