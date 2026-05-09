import { createAppController } from '../controllers/app-controller';
import { createAuthController } from '../controllers/auth-controller';
import { createTodoController } from '../controllers/todo-controller';
import { createMysqlAppRepository } from './mysql-app-repository';
import { createMysqlTodoRepository } from './mysql-todo-repository';
import { createMysqlUserRepository } from './mysql-user-repository';
import { createMysqlPool } from './mysql-client';
import { createAppInteractor } from '../services/app-interactor';
import { createAuthInteractor } from '../services/auth-interactor';
import { createTodoInteractor } from '../services/todo-interactor';
import { createHonoApp } from './hono-app';
import type { Hono } from 'hono';

type MysqlBackendRegistry = {
  app: Hono;
};

/**
 * Creates the backend registry wired to MySQL repositories.
 */
export function createMysqlBackendRegistry(): MysqlBackendRegistry {
  const pool = createMysqlPool();
  const appRepository = createMysqlAppRepository(pool);
  const todoRepository = createMysqlTodoRepository(pool);
  const userRepository = createMysqlUserRepository(pool);
  const appUsecase = createAppInteractor({ appRepository, todoRepository });
  const todoUsecase = createTodoInteractor({ appRepository, todoRepository });
  const authUsecase = createAuthInteractor({ userRepository });
  const appController = createAppController(appUsecase);
  const todoController = createTodoController(todoUsecase);
  const authController = createAuthController(authUsecase);
  const app = createHonoApp({ appController, todoController, authController });

  return { app };
}
