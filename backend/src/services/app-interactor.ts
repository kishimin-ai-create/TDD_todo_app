import { AppError } from '../models/app-error';
import type { AppEntity } from '../models/app';
import type { AppRepository } from '../repositories/app-repository';
import type { TodoRepository } from '../repositories/todo-repository';
import type {
  AppUsecase,
  CreateAppInput,
  DeleteAppInput,
  GetAppInput,
  UpdateAppInput,
} from './app-usecase';

type AppInteractorDependencies = {
  appRepository: AppRepository;
  todoRepository: TodoRepository;
  generateId?: () => string;
  now?: () => string;
};

/**
 * Creates the app use case interactor and wires its dependencies.
 */
export function createAppInteractor(
  dependencies: AppInteractorDependencies,
): AppUsecase {
  const appRepository = dependencies.appRepository;
  const todoRepository = dependencies.todoRepository;
  const generateId = dependencies.generateId ?? (() => crypto.randomUUID());
  const now = dependencies.now ?? (() => new Date().toISOString());

  async function findAccessibleApp(input: {
    appId: string;
    userId: string;
  }): Promise<AppEntity> {
    const app = await appRepository.findActiveById(input.appId);
    if (!app) throw new AppError('NOT_FOUND', 'App not found');
    if (app.userId !== input.userId) {
      throw new AppError('FORBIDDEN', 'Access denied');
    }
    return app;
  }

  async function create(input: CreateAppInput): Promise<AppEntity> {
    const duplicated = await appRepository.existsActiveByName(
      input.name,
      input.userId,
    );
    if (duplicated) throw new AppError('CONFLICT', 'App name already exists');
    const timestamp = now();
    const app: AppEntity = {
      id: generateId(),
      userId: input.userId,
      name: input.name,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };
    await appRepository.save(app);
    return app;
  }

  async function list(userId: string): Promise<AppEntity[]> {
    return appRepository.listActiveByUserId(userId);
  }

  async function get(input: GetAppInput): Promise<AppEntity> {
    return findAccessibleApp(input);
  }

  async function update(input: UpdateAppInput): Promise<AppEntity> {
    const app = await findAccessibleApp(input);
    if (input.name !== undefined) {
      const duplicated = await appRepository.existsActiveByName(
        input.name,
        input.userId,
        app.id,
      );
      if (duplicated) throw new AppError('CONFLICT', 'App name already exists');
    }
    const updatedApp: AppEntity = {
      ...app,
      name: input.name ?? app.name,
      updatedAt: now(),
    };
    await appRepository.save(updatedApp);
    return updatedApp;
  }

  async function remove(input: DeleteAppInput): Promise<AppEntity> {
    const app = await findAccessibleApp(input);
    const deletedAt = now();
    const deletedApp: AppEntity = { ...app, updatedAt: deletedAt, deletedAt };
    await appRepository.save(deletedApp);
    const todos = await todoRepository.listActiveByAppId(app.id);
    for (const todo of todos) {
      await todoRepository.save({ ...todo, updatedAt: deletedAt, deletedAt });
    }
    return deletedApp;
  }

  return { create, list, get, update, delete: remove };
}
