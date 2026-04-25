import { createAppController } from '../controllers/app-controller';
import { createTodoController } from '../controllers/todo-controller';
import { createMysqlAppRepository } from './mysql-app-repository';
import { createMysqlTodoRepository } from './mysql-todo-repository';
import { createMysqlPool } from './mysql-client';
import { createAppInteractor } from '../services/app-interactor';
import { createTodoInteractor } from '../services/todo-interactor';
import { createHonoApp } from './hono-app';

/**
 * Creates the backend registry wired to MySQL repositories.
 */
export function createMysqlBackendRegistry() {
  const pool = createMysqlPool();
  const appRepository = createMysqlAppRepository(pool);
  const todoRepository = createMysqlTodoRepository(pool);
  const appUsecase = createAppInteractor({ appRepository, todoRepository });
  const todoUsecase = createTodoInteractor({ appRepository, todoRepository });
  const appController = createAppController(appUsecase);
  const todoController = createTodoController(todoUsecase);
  const app = createHonoApp({ appController, todoController });

  return { app };
}
