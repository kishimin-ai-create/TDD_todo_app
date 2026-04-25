import type { AppEntity } from '../../domain/entities/app';
import type { TodoEntity } from '../../domain/entities/todo';

export type InMemoryStorage = {
  apps: Map<string, AppEntity>;
  todos: Map<string, TodoEntity>;
  clear(): void;
};

/**
 * Creates the shared in-memory storage used by repository gateways.
 */
export function createInMemoryStorage(): InMemoryStorage {
  const apps = new Map<string, AppEntity>();
  const todos = new Map<string, TodoEntity>();

  return {
    apps,
    todos,
    clear() {
      apps.clear();
      todos.clear();
    },
  };
}
