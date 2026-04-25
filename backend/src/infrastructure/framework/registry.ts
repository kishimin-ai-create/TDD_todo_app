import { createAppController } from '../../interface/controllers/app-controller';
import { createTodoController } from '../../interface/controllers/todo-controller';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../interface/gateways/in-memory-repositories';
import { createInMemoryStorage } from '../../interface/gateways/in-memory-storage';
import { createAppInteractor } from '../../usecase/interactors/app-interactor';
import { createTodoInteractor } from '../../usecase/interactors/todo-interactor';
import { createHonoApp } from './hono-app';

/**
 * Creates the backend registry and wires every layer together.
 */
export function createBackendRegistry() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const appUsecase = createAppInteractor({
    appRepository,
    todoRepository,
  });
  const todoUsecase = createTodoInteractor({
    appRepository,
    todoRepository,
  });
  const appController = createAppController(appUsecase);
  const todoController = createTodoController(todoUsecase);
  const app = createHonoApp({
    appController,
    todoController,
  });

  return {
    app,
    clearStorage() {
      storage.clear();
    },
  };
}
