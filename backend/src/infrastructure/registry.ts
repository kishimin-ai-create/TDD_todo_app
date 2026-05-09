import { createAppController } from '../controllers/app-controller';
import { createTodoController } from '../controllers/todo-controller';
import { createAuthController } from '../controllers/auth-controller';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from './in-memory-repositories';
import { createInMemoryUserRepository } from './in-memory-user-repository';
import { createInMemoryStorage } from './in-memory-storage';
import { createAppInteractor } from '../services/app-interactor';
import { createTodoInteractor } from '../services/todo-interactor';
import { createAuthInteractor } from '../services/auth-interactor';
import { createHonoApp, createJwtSigner } from './hono-app';
import type { Hono } from 'hono';

type BackendRegistry = {
  app: Hono;
  clearStorage: () => void;
};

const TEST_JWT_SECRET = 'test-jwt-secret-for-integration-tests';

/**
 * Creates the backend registry and wires every layer together.
 */
export function createBackendRegistry(): BackendRegistry {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const userRepository = createInMemoryUserRepository(storage);
  const jwtSecret = process.env.JWT_SECRET ?? TEST_JWT_SECRET;
  const signToken = createJwtSigner(jwtSecret);
  const appUsecase = createAppInteractor({
    appRepository,
    todoRepository,
  });
  const todoUsecase = createTodoInteractor({
    appRepository,
    todoRepository,
  });
  const authUsecase = createAuthInteractor({
    userRepository,
    signToken,
  });
  const appController = createAppController(appUsecase);
  const todoController = createTodoController(todoUsecase);
  const authController = createAuthController(authUsecase);
  const app = createHonoApp({
    appController,
    todoController,
    authController,
    jwtSecret,
  });

  return {
    app,
    clearStorage: () => {
      storage.clear();
    },
  };
}

export { TEST_JWT_SECRET };
