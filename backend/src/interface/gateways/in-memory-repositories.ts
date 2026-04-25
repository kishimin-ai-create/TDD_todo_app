import { AppError } from '../../domain/entities/app-error';
import type { AppEntity } from '../../domain/entities/app';
import type { TodoEntity } from '../../domain/entities/todo';
import type { AppRepository } from '../../domain/repositories/app-repository';
import type { TodoRepository } from '../../domain/repositories/todo-repository';
import type { InMemoryStorage } from './in-memory-storage';

/**
 * Creates the in-memory implementation of the app repository port.
 */
export function createInMemoryAppRepository(
  storage: InMemoryStorage,
): AppRepository {
  async function save(app: AppEntity): Promise<void> {
    withRepositoryError(() => {
      storage.apps.set(app.id, cloneApp(app));
    });
  }

  async function listActive(): Promise<AppEntity[]> {
    return withRepositoryError(() =>
      [...storage.apps.values()]
        .filter(app => app.deletedAt === null)
        .map(cloneApp),
    );
  }

  async function findActiveById(id: string): Promise<AppEntity | null> {
    return withRepositoryError(() => {
      const app = storage.apps.get(id);
      return app && app.deletedAt === null ? cloneApp(app) : null;
    });
  }

  async function existsActiveByName(
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    return withRepositoryError(() =>
      [...storage.apps.values()].some(
        app =>
          app.deletedAt === null && app.name === name && app.id !== excludeId,
      ),
    );
  }

  return {
    save,
    listActive,
    findActiveById,
    existsActiveByName,
  };
}

/**
 * Creates the in-memory implementation of the todo repository port.
 */
export function createInMemoryTodoRepository(
  storage: InMemoryStorage,
): TodoRepository {
  async function save(todo: TodoEntity): Promise<void> {
    withRepositoryError(() => {
      storage.todos.set(todo.id, cloneTodo(todo));
    });
  }

  async function listActiveByAppId(appId: string): Promise<TodoEntity[]> {
    return withRepositoryError(() =>
      [...storage.todos.values()]
        .filter(todo => todo.appId === appId && todo.deletedAt === null)
        .map(cloneTodo),
    );
  }

  async function findActiveById(
    appId: string,
    todoId: string,
  ): Promise<TodoEntity | null> {
    return withRepositoryError(() => {
      const todo = storage.todos.get(todoId);
      return todo && todo.appId === appId && todo.deletedAt === null
        ? cloneTodo(todo)
        : null;
    });
  }

  return {
    save,
    listActiveByAppId,
    findActiveById,
  };
}

function cloneApp(app: AppEntity): AppEntity {
  return { ...app };
}

function cloneTodo(todo: TodoEntity): TodoEntity {
  return { ...todo };
}

function withRepositoryError<T>(operation: () => T): T {
  try {
    return operation();
  } catch {
    throw new AppError('REPOSITORY_ERROR', 'Repository operation failed');
  }
}
