import { describe, it, expect } from 'vitest';

import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';
import { createTodoInteractor } from '../../../services/todo-interactor';
import { presentApp, presentTodo } from '../../../controllers/http-presenter';

function setup() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const appInteractor = createAppInteractor({ appRepository, todoRepository });
  const todoInteractor = createTodoInteractor({ appRepository, todoRepository });
  return { appInteractor, todoInteractor };
}

describe('HttpPresenter integration', () => {
  describe('presentApp', () => {
    it('returns the correct DTO shape from a real app entity', async () => {
      const { appInteractor } = setup();
      const app = await appInteractor.create({ name: 'Presenter Test' });
      const dto = presentApp(app);
      expect(dto).toEqual({
        id: app.id,
        name: app.name,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      });
    });

    it('DTO does not include deletedAt', async () => {
      const { appInteractor } = setup();
      const app = await appInteractor.create({ name: 'No Deleted' });
      const dto = presentApp(app);
      expect(dto).not.toHaveProperty('deletedAt');
    });

    it('createdAt and updatedAt are ISO strings from the real entity', async () => {
      const { appInteractor } = setup();
      const app = await appInteractor.create({ name: 'Timestamps' });
      const dto = presentApp(app);
      expect(dto.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(dto.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('name matches what was given at creation', async () => {
      const { appInteractor } = setup();
      const app = await appInteractor.create({ name: 'Named Right' });
      expect(presentApp(app).name).toBe('Named Right');
    });
  });

  describe('presentTodo', () => {
    it('returns the correct DTO shape from a real todo entity', async () => {
      const { appInteractor, todoInteractor } = setup();
      const app = await appInteractor.create({ name: 'App For Todo' });
      const todo = await todoInteractor.create({ appId: app.id, title: 'My Todo' });
      const dto = presentTodo(todo);
      expect(dto).toEqual({
        id: todo.id,
        appId: todo.appId,
        title: todo.title,
        completed: todo.completed,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
      });
    });

    it('DTO does not include deletedAt', async () => {
      const { appInteractor, todoInteractor } = setup();
      const app = await appInteractor.create({ name: 'App' });
      const todo = await todoInteractor.create({ appId: app.id, title: 'Todo' });
      const dto = presentTodo(todo);
      expect(dto).not.toHaveProperty('deletedAt');
    });

    it('appId matches the parent app', async () => {
      const { appInteractor, todoInteractor } = setup();
      const app = await appInteractor.create({ name: 'Parent' });
      const todo = await todoInteractor.create({ appId: app.id, title: 'Child' });
      expect(presentTodo(todo).appId).toBe(app.id);
    });

    it('completed defaults to false on a freshly created todo', async () => {
      const { appInteractor, todoInteractor } = setup();
      const app = await appInteractor.create({ name: 'App' });
      const todo = await todoInteractor.create({ appId: app.id, title: 'Fresh' });
      expect(presentTodo(todo).completed).toBe(false);
    });

    it('completed reflects the updated value from the real entity', async () => {
      const { appInteractor, todoInteractor } = setup();
      const app = await appInteractor.create({ name: 'App' });
      const todo = await todoInteractor.create({ appId: app.id, title: 'Check' });
      const updated = await todoInteractor.update({ appId: app.id, todoId: todo.id, completed: true });
      expect(presentTodo(updated).completed).toBe(true);
    });
  });
});
