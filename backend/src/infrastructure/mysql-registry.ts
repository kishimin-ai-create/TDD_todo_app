import { createAppController } from '../controllers/app-controller';
import { createTodoController } from '../controllers/todo-controller';
import { createAppInteractor } from '../services/app-interactor';
import { createTodoInteractor } from '../services/todo-interactor';
import { createAuthInteractor } from '../services/auth-interactor';
import { createKysely } from './db';
import { createHonoApp } from './hono-app';
import { createMysqlAppRepository } from './mysql-app-repository';
import { createMysqlTodoRepository } from './mysql-todo-repository';
import { createMysqlUserRepository } from './mysql-user-repository';

type MysqlBackendRegistry = {
  app: ReturnType<typeof createHonoApp>;
};

/**
 * Creates the backend registry wired to MySQL repositories.
 */
export function createMysqlBackendRegistry(): MysqlBackendRegistry {
  const db = createKysely();
  const appRepository = createMysqlAppRepository(db);
  const todoRepository = createMysqlTodoRepository(db);
  const userRepository = createMysqlUserRepository(db);
  const appUsecase = createAppInteractor({ appRepository, todoRepository });
  const todoUsecase = createTodoInteractor({ appRepository, todoRepository });
  const authUsecase = createAuthInteractor({ userRepository });
  const appController = createAppController(appUsecase);
  const todoController = createTodoController(todoUsecase);
  const app = createHonoApp({ appController, todoController, authUsecase, userRepository });

  return { app };
}
