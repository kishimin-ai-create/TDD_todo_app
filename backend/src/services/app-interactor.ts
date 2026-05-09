import { AppError } from '../models/app-error';
import type { AppEntity } from '../models/app';
import type { AppRepository } from '../repositories/app-repository';
import type { TodoRepository } from '../repositories/todo-repository';
import type {
  AppUsecase,
  CreateAppInput,
  DeleteAppInput,
  GetAppInput,
  ListAppsInput,
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

  async function findOwnedApp(appId: string, userId: string): Promise<AppEntity> {
    const app = await appRepository.findActiveById(appId);
    if (!app) throw new AppError('NOT_FOUND', 'App not found');
    if (app.userId !== userId) throw new AppError('NOT_FOUND', 'App not found');
    return app;
  }

  async function create(input: CreateAppInput): Promise<AppEntity> {
    const duplicated = await appRepository.existsActiveByName(input.name, input.userId);
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

  async function list(input: ListAppsInput): Promise<AppEntity[]> {
    return appRepository.listActiveByUserId(input.userId);
  }

  async function get(input: GetAppInput): Promise<AppEntity> {
    return findOwnedApp(input.appId, input.userId);
  }

  async function update(input: UpdateAppInput): Promise<AppEntity> {
    const app = await findOwnedApp(input.appId, input.userId);
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
    const app = await findOwnedApp(input.appId, input.userId);
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
