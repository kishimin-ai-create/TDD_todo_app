import type { AppEntity } from '../models/app';
import type { TodoEntity } from '../models/todo';
import type { UserEntity } from '../models/user';

/**
 * Storage object for in-memory data.
 */
export type InMemoryStorage = {
  apps: Map<string, AppEntity>;
  todos: Map<string, TodoEntity>;
  users: Map<string, UserEntity>;
  clear(): void;
};

/**
 * Creates the shared in-memory storage used by repository gateways.
 */
export function createInMemoryStorage(): InMemoryStorage {
  const apps = new Map<string, AppEntity>();
  const todos = new Map<string, TodoEntity>();
  const users = new Map<string, UserEntity>();

  return {
    apps,
    todos,
    users,
    clear() {
      apps.clear();
      todos.clear();
      users.clear();
    },
  };
}
