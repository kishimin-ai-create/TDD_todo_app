import { describe, it, expect } from 'vitest';

import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import type { AppEntity } from '../../../models/app';
import type { TodoEntity } from '../../../models/todo';

function makeApp(id: string, userId: string, name: string, deleted = false): AppEntity {
  return {
    id,
    userId,
    name,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: deleted ? '2024-01-02T00:00:00.000Z' : null,
  };
}

function makeTodo(id: string, appId: string, title: string, deleted = false): TodoEntity {
  return {
    id,
    appId,
    title,
    completed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: deleted ? '2024-01-02T00:00:00.000Z' : null,
  };
}

describe('InMemoryRepositories cross-repo integration', () => {
  it('listActiveByUserId filters apps by owner', async () => {
    const storage = createInMemoryStorage();
    const appRepo = createInMemoryAppRepository(storage);
    await appRepo.save(makeApp('a1', 'user-1', 'App 1'));
    await appRepo.save(makeApp('a2', 'user-2', 'App 2'));
    expect(await appRepo.listActiveByUserId('user-1')).toHaveLength(1);
  });

  it('storage.clear() resets both repos at once', async () => {
    const storage = createInMemoryStorage();
    const appRepo = createInMemoryAppRepository(storage);
    const todoRepo = createInMemoryTodoRepository(storage);
    await appRepo.save(makeApp('a1', 'user-1', 'App'));
    await todoRepo.save(makeTodo('t1', 'a1', 'Todo'));
    storage.clear();
    expect(await appRepo.listActiveByUserId('user-1')).toHaveLength(0);
    expect(await todoRepo.listActiveByAppId('a1')).toHaveLength(0);
  });

  it('returned app entities are defensive copies', async () => {
    const storage = createInMemoryStorage();
    const appRepo = createInMemoryAppRepository(storage);
    await appRepo.save(makeApp('a1', 'user-1', 'Original'));
    const found = await appRepo.findActiveById('a1');
    if (found) found.name = 'Mutated';
    const found2 = await appRepo.findActiveById('a1');
    expect(found2?.name).toBe('Original');
  });
});
