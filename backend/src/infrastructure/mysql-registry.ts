import type { Hono } from 'hono';

import { createAppController } from '../controllers/app-controller';
import { createTodoController } from '../controllers/todo-controller';
import { createAppInteractor } from '../services/app-interactor';
import { createTodoInteractor } from '../services/todo-interactor';
import { createKysely } from './db';
import { createHonoApp } from './hono-app';
import { createMysqlAppRepository } from './mysql-app-repository';
import { createMysqlTodoRepository } from './mysql-todo-repository';

type MysqlBackendRegistry = {
  app: Hono;
};

/**
 * Creates the backend registry wired to MySQL repositories.
 */
export function createMysqlBackendRegistry(): MysqlBackendRegistry {
  const db = createKysely();
  const appRepository = createMysqlAppRepository(db);
  const todoRepository = createMysqlTodoRepository(db);
  const appUsecase = createAppInteractor({ appRepository, todoRepository });
  const todoUsecase = createTodoInteractor({ appRepository, todoRepository });
  const appController = createAppController(appUsecase);
  const todoController = createTodoController(todoUsecase);
  const app = createHonoApp({ appController, todoController });

  return { app };
}
