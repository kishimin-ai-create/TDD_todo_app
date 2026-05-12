import { describe, it, expect } from 'vitest';

import type { AppEntity } from '../../../models/app';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';

const TIME = '2024-01-01T00:00:00.000Z';
const USER_ID = 'user-1';

describe('AppEntity', () => {
  it('active entity has deletedAt as null', () => {
    const app: AppEntity = {
      id: 'app-1',
      userId: USER_ID,
      name: 'Test',
      createdAt: TIME,
      updatedAt: TIME,
      deletedAt: null,
    };
    expect(app.deletedAt).toBeNull();
  });

  it('soft-deleted entity has deletedAt as an ISO string', () => {
    const app: AppEntity = {
      id: 'app-1',
      userId: USER_ID,
      name: 'Test',
      createdAt: TIME,
      updatedAt: TIME,
      deletedAt: '2024-01-02T00:00:00.000Z',
    };
    expect(typeof app.deletedAt).toBe('string');
  });

  it('entity created by interactor has all AppEntity fields with correct types', async () => {
    const storage = createInMemoryStorage();
    const interactor = createAppInteractor({
      appRepository: createInMemoryAppRepository(storage),
      todoRepository: createInMemoryTodoRepository(storage),
    });
    const app = await interactor.create({ name: 'Shape Test', userId: USER_ID });
    expect(typeof app.id).toBe('string');
    expect(app.userId).toBe(USER_ID);
    expect(app.name).toBe('Shape Test');
    expect(typeof app.createdAt).toBe('string');
    expect(typeof app.updatedAt).toBe('string');
    expect(app.deletedAt).toBeNull();
  });

  it('soft-deleted entity returned by interactor has deletedAt set to a string', async () => {
    const storage = createInMemoryStorage();
    const interactor = createAppInteractor({
      appRepository: createInMemoryAppRepository(storage),
      todoRepository: createInMemoryTodoRepository(storage),
    });
    const app = await interactor.create({ name: 'Del Test', userId: USER_ID });
    const deleted = await interactor.delete({ appId: app.id, userId: USER_ID });
    expect(deleted.deletedAt).not.toBeNull();
    expect(typeof deleted.deletedAt).toBe('string');
  });

  it('entity is stored and retrieved with the same shape through the repository', async () => {
    const storage = createInMemoryStorage();
    const repo = createInMemoryAppRepository(storage);
    const entity: AppEntity = {
      id: 'app-persist',
      userId: USER_ID,
      name: 'Persisted',
      createdAt: TIME,
      updatedAt: TIME,
      deletedAt: null,
    };
    await repo.save(entity);
    const found = await repo.findActiveById('app-persist');
    expect(found).toEqual(entity);
  });
});
