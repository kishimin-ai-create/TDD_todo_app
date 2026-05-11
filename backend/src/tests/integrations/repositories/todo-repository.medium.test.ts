import { describe, it, expect, beforeEach } from 'vitest';

import type { TodoRepository } from '../../../repositories/todo-repository';
import { createInMemoryTodoRepository } from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import type { TodoEntity } from '../../../models/todo';

const TIME = '2024-01-01T00:00:00.000Z';

function makeTodo(
  id: string,
  appId: string,
  title = 'Test Todo',
  deletedAt: string | null = null,
): TodoEntity {
  return { id, appId, title, completed: false, createdAt: TIME, updatedAt: TIME, deletedAt };
}

describe('TodoRepository contract', () => {
  let repo: TodoRepository;

  beforeEach(() => {
    repo = createInMemoryTodoRepository(createInMemoryStorage());
  });

  // ─── save + findActiveById ────────────────────────────────────────────────

  describe('save + findActiveById', () => {
    it('persisted entity is retrievable by appId and todoId', async () => {
      await repo.save(makeTodo('todo-1', 'app-1', 'My Todo'));
      const found = await repo.findActiveById('app-1', 'todo-1');
      expect(found?.id).toBe('todo-1');
      expect(found?.title).toBe('My Todo');
    });

    it('returns null for an unknown todoId', async () => {
      expect(await repo.findActiveById('app-1', 'unknown')).toBeNull();
    });

    it('returns null when appId does not match the stored todo', async () => {
      await repo.save(makeTodo('todo-1', 'app-1'));
      expect(await repo.findActiveById('app-2', 'todo-1')).toBeNull();
    });

    it('returns null for a soft-deleted entity', async () => {
      await repo.save(makeTodo('todo-1', 'app-1', 'Deleted', TIME));
      expect(await repo.findActiveById('app-1', 'todo-1')).toBeNull();
    });

    it('overwriting with the same id updates the entity', async () => {
      await repo.save(makeTodo('todo-1', 'app-1', 'Original'));
      await repo.save(makeTodo('todo-1', 'app-1', 'Updated'));
      expect((await repo.findActiveById('app-1', 'todo-1'))?.title).toBe('Updated');
    });

    it('returned entity is a defensive copy, not the original reference', async () => {
      const todo = makeTodo('todo-1', 'app-1');
      await repo.save(todo);
      const found = await repo.findActiveById('app-1', 'todo-1');
      expect(found).not.toBe(todo);
    });
  });

  // ─── listActiveByAppId ────────────────────────────────────────────────────

  describe('listActiveByAppId', () => {
    it('returns empty array when no todos exist for the appId', async () => {
      expect(await repo.listActiveByAppId('app-1')).toEqual([]);
    });

    it('returns active todos for the given appId', async () => {
      await repo.save(makeTodo('todo-1', 'app-1', 'T1'));
      await repo.save(makeTodo('todo-2', 'app-1', 'T2'));
      const list = await repo.listActiveByAppId('app-1');
      expect(list).toHaveLength(2);
    });

    it('excludes todos belonging to a different appId', async () => {
      await repo.save(makeTodo('todo-1', 'app-1'));
      await repo.save(makeTodo('todo-2', 'app-2'));
      const list = await repo.listActiveByAppId('app-1');
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('todo-1');
    });

    it('excludes soft-deleted todos', async () => {
      await repo.save(makeTodo('todo-1', 'app-1', 'Deleted', TIME));
      await repo.save(makeTodo('todo-2', 'app-1', 'Active'));
      const list = await repo.listActiveByAppId('app-1');
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('todo-2');
    });
  });
});
