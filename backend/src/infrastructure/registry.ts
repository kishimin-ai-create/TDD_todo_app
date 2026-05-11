import { createAppController } from '../controllers/app-controller';
import { createTodoController } from '../controllers/todo-controller';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from './in-memory-repositories';
import { createInMemoryStorage } from './in-memory-storage';
import { createAppInteractor } from '../services/app-interactor';
import { createTodoInteractor } from '../services/todo-interactor';
import { createHonoApp } from './hono-app';
import type { UserRecord } from './hono-app';
import type { Hono } from 'hono';

type BackendRegistry = {
  app: Hono;
  clearStorage: () => void;
};

/**
 * Creates the backend registry and wires every layer together.
 */
export function createBackendRegistry(): BackendRegistry {
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
  const userStore = new Map<string, UserRecord>();
  const app = createHonoApp({
    appController,
    todoController,
    userStore,
  });

  return {
    app,
    clearStorage: () => {
      storage.clear();
      userStore.clear();
    },
  };
}
