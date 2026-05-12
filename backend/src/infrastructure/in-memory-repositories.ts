import { AppError } from '../models/app-error';
import type { AppEntity } from '../models/app';
import type { TodoEntity } from '../models/todo';
import type { UserEntity } from '../models/user';
import type { AppRepository } from '../repositories/app-repository';
import type { TodoRepository } from '../repositories/todo-repository';
import type { UserRepository } from '../repositories/user-repository';
import type { InMemoryStorage } from './in-memory-storage';

/**
 * Creates the in-memory implementation of the app repository port.
 */
export function createInMemoryAppRepository(
  storage: InMemoryStorage,
): AppRepository {
  function save(app: AppEntity): Promise<void> {
    return Promise.resolve().then(() =>
      withRepositoryError(() => {
        storage.apps.set(app.id, cloneApp(app));
      }),
    );
  }

  function listActiveByUserId(userId: string): Promise<AppEntity[]> {
    return Promise.resolve().then(() =>
      withRepositoryError(() =>
        [...storage.apps.values()]
          .filter(app => app.userId === userId && app.deletedAt === null)
          .map(cloneApp),
      ),
    );
  }

  function findActiveById(id: string): Promise<AppEntity | null> {
    return Promise.resolve().then(() =>
      withRepositoryError(() => {
        const app = storage.apps.get(id);
        return app && app.deletedAt === null ? cloneApp(app) : null;
      }),
    );
  }

  function existsActiveByName(
    name: string,
    userId: string,
    excludeId?: string,
  ): Promise<boolean> {
    return Promise.resolve().then(() =>
      withRepositoryError(() =>
        [...storage.apps.values()].some(
          app =>
            app.userId === userId &&
            app.deletedAt === null &&
            app.name === name &&
            app.id !== excludeId,
        ),
      ),
    );
  }

  return {
    save,
    listActiveByUserId,
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
  function save(todo: TodoEntity): Promise<void> {
    return Promise.resolve().then(() =>
      withRepositoryError(() => {
        storage.todos.set(todo.id, cloneTodo(todo));
      }),
    );
  }

  function listActiveByAppId(appId: string): Promise<TodoEntity[]> {
    return Promise.resolve().then(() =>
      withRepositoryError(() =>
        [...storage.todos.values()]
          .filter(todo => todo.appId === appId && todo.deletedAt === null)
          .map(cloneTodo),
      ),
    );
  }

  function findActiveById(
    appId: string,
    todoId: string,
  ): Promise<TodoEntity | null> {
    return Promise.resolve().then(() =>
      withRepositoryError(() => {
        const todo = storage.todos.get(todoId);
        return todo && todo.appId === appId && todo.deletedAt === null
          ? cloneTodo(todo)
          : null;
      }),
    );
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

/**
 * User repository implementation with an additional clear method for test isolation.
 */
export type ClearableUserRepository = UserRepository & { clear(): void };

/**
 * Creates the in-memory implementation of the user repository port.
 */
export function createInMemoryUserRepository(): ClearableUserRepository {
  const store = new Map<string, UserEntity>();

  function findByEmail(email: string): Promise<UserEntity | null> {
    return Promise.resolve().then(() =>
      withRepositoryError(() => {
        const user = store.get(email);
        return user ? { ...user } : null;
      }),
    );
  }

  function findByToken(token: string): Promise<UserEntity | null> {
    return Promise.resolve().then(() =>
      withRepositoryError(() => {
        const user = [...store.values()].find(current => current.token === token);
        return user ? { ...user } : null;
      }),
    );
  }

  function save(user: UserEntity): Promise<void> {
    return Promise.resolve().then(() =>
      withRepositoryError(() => {
        store.set(user.email, { ...user });
      }),
    );
  }

  function clear(): void {
    store.clear();
  }

  return { findByEmail, findByToken, save, clear };
}
