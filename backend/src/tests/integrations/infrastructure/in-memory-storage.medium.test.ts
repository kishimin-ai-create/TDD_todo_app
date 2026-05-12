import { describe, it, expect } from 'vitest';

import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import type { AppEntity } from '../../../models/app';
import type { TodoEntity } from '../../../models/todo';

const APP: AppEntity = {
  id: 'a1',
  userId: 'user-1',
  name: 'Test App',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

const TODO: TodoEntity = {
  id: 't1',
  appId: 'a1',
  title: 'Test Todo',
  completed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

describe('InMemoryStorage integration', () => {
  it('creates a fresh storage instance with usable maps', () => {
    const storage = createInMemoryStorage();
    expect(storage.apps.size).toBe(0);
    expect(storage.todos.size).toBe(0);
    storage.apps.set(APP.id, APP);
    storage.todos.set(TODO.id, TODO);
    expect(storage.apps.get(APP.id)?.userId).toBe('user-1');
    expect(storage.todos.get(TODO.id)?.title).toBe('Test Todo');
  });

  it('clear() empties both maps and remains reusable', () => {
    const storage = createInMemoryStorage();
    storage.apps.set(APP.id, APP);
    storage.todos.set(TODO.id, TODO);
    storage.clear();
    expect(storage.apps.size).toBe(0);
    expect(storage.todos.size).toBe(0);
    storage.apps.set('a2', { ...APP, id: 'a2' });
    expect(storage.apps.size).toBe(1);
  });
});
