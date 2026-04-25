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

  async function findExistingApp(appId: string): Promise<AppEntity> {
    const app = await appRepository.findActiveById(appId);
    if (!app) throw new AppError('NOT_FOUND', 'App not found');
    return app;
  }

  async function create(input: CreateAppInput): Promise<AppEntity> {
    const duplicated = await appRepository.existsActiveByName(input.name);
    if (duplicated) throw new AppError('CONFLICT', 'App name already exists');
    const timestamp = now();
    const app: AppEntity = {
      id: generateId(),
      name: input.name,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };
    await appRepository.save(app);
    return app;
  }

  async function list(): Promise<AppEntity[]> {
    return appRepository.listActive();
  }

  async function get(input: GetAppInput): Promise<AppEntity> {
    return findExistingApp(input.appId);
  }

  async function update(input: UpdateAppInput): Promise<AppEntity> {
    const app = await findExistingApp(input.appId);
    if (input.name !== undefined) {
      const duplicated = await appRepository.existsActiveByName(
        input.name,
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
    const app = await findExistingApp(input.appId);
    const deletedAt = now();
    const deletedApp: AppEntity = { ...app, deletedAt };
    await appRepository.save(deletedApp);
    const todos = await todoRepository.listActiveByAppId(app.id);
    for (const todo of todos) {
      await todoRepository.save({ ...todo, deletedAt });
    }
    return deletedApp;
  }

  return { create, list, get, update, delete: remove };
}
