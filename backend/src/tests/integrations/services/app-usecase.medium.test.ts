import { describe, it, expect } from 'vitest';

import { createAppInteractor } from '../../../services/app-interactor';
import type { AppUsecase } from '../../../services/app-usecase';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';

function makeUsecase(): AppUsecase {
  const storage = createInMemoryStorage();
  return createAppInteractor({
    appRepository: createInMemoryAppRepository(storage),
    todoRepository: createInMemoryTodoRepository(storage),
  });
}

describe('AppUsecase interface contract', () => {
  it('createAppInteractor satisfies the AppUsecase interface', () => {
    const usecase: AppUsecase = makeUsecase();
    expect(typeof usecase.create).toBe('function');
    expect(typeof usecase.list).toBe('function');
    expect(typeof usecase.get).toBe('function');
    expect(typeof usecase.update).toBe('function');
    expect(typeof usecase.delete).toBe('function');
  });

  it('create resolves to an AppEntity shape', async () => {
    const usecase = makeUsecase();
    const app = await usecase.create({ name: 'Contract Test' });
    expect(app).toMatchObject({
      id: expect.any(String),
      name: 'Contract Test',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
  });

  it('list resolves to an array', async () => {
    const usecase = makeUsecase();
    const result = await usecase.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it('get resolves to the app by id', async () => {
    const usecase = makeUsecase();
    const created = await usecase.create({ name: 'Get Contract' });
    const found = await usecase.get({ appId: created.id });
    expect(found.id).toBe(created.id);
  });

  it('update resolves to the modified app', async () => {
    const usecase = makeUsecase();
    const created = await usecase.create({ name: 'Original' });
    const updated = await usecase.update({ appId: created.id, name: 'Updated' });
    expect(updated.name).toBe('Updated');
  });

  it('delete resolves to the soft-deleted app', async () => {
    const usecase = makeUsecase();
    const created = await usecase.create({ name: 'To Delete' });
    const deleted = await usecase.delete({ appId: created.id });
    expect(deleted.deletedAt).not.toBeNull();
  });
});
