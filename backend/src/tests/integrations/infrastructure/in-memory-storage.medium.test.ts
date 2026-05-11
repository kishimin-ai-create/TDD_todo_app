import { describe, it, expect } from 'vitest';

import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import type { AppEntity } from '../../../models/app';
import type { TodoEntity } from '../../../models/todo';

const APP: AppEntity = {
  id: 'a1',
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
  describe('createInMemoryStorage', () => {
    it('creates storage with empty apps map', () => {
      const storage = createInMemoryStorage();
      expect(storage.apps.size).toBe(0);
    });

    it('creates storage with empty todos map', () => {
      const storage = createInMemoryStorage();
      expect(storage.todos.size).toBe(0);
    });

    it('apps and todos are separate Map instances', () => {
      const storage = createInMemoryStorage();
      expect(storage.apps).toBeInstanceOf(Map);
      expect(storage.todos).toBeInstanceOf(Map);
      expect(storage.apps).not.toBe(storage.todos);
    });

    it('creates a fresh independent instance each time', () => {
      const s1 = createInMemoryStorage();
      const s2 = createInMemoryStorage();
      s1.apps.set('a1', APP);
      expect(s2.apps.size).toBe(0);
    });
  });

  describe('direct Map operations', () => {
    it('can store and retrieve an app entity', () => {
      const storage = createInMemoryStorage();
      storage.apps.set(APP.id, APP);
      expect(storage.apps.get('a1')).toEqual(APP);
    });

    it('can store and retrieve a todo entity', () => {
      const storage = createInMemoryStorage();
      storage.todos.set(TODO.id, TODO);
      expect(storage.todos.get('t1')).toEqual(TODO);
    });
  });

  describe('clear()', () => {
    it('empties the apps map', () => {
      const storage = createInMemoryStorage();
      storage.apps.set('a1', APP);
      storage.clear();
      expect(storage.apps.size).toBe(0);
    });

    it('empties the todos map', () => {
      const storage = createInMemoryStorage();
      storage.todos.set('t1', TODO);
      storage.clear();
      expect(storage.todos.size).toBe(0);
    });

    it('clears both maps in a single call', () => {
      const storage = createInMemoryStorage();
      storage.apps.set('a1', APP);
      storage.todos.set('t1', TODO);
      storage.clear();
      expect(storage.apps.size).toBe(0);
      expect(storage.todos.size).toBe(0);
    });

    it('is idempotent — calling clear() twice does not throw', () => {
      const storage = createInMemoryStorage();
      storage.apps.set('a1', APP);
      storage.clear();
      expect(() => storage.clear()).not.toThrow();
      expect(storage.apps.size).toBe(0);
    });

    it('maps are still usable after clear()', () => {
      const storage = createInMemoryStorage();
      storage.apps.set('a1', APP);
      storage.clear();
      storage.apps.set('a2', { ...APP, id: 'a2' });
      expect(storage.apps.size).toBe(1);
    });
  });
});
