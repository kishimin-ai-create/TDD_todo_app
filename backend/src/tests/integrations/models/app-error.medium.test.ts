import { describe, it, expect } from 'vitest';

import { AppError, isAppError } from '../../../models/app-error';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';

const GHOST_ID = '00000000-0000-0000-0000-000000000000';
const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

function makeInteractor() {
  const storage = createInMemoryStorage();
  return createAppInteractor({
    appRepository: createInMemoryAppRepository(storage),
    todoRepository: createInMemoryTodoRepository(storage),
  });
}

describe('AppError cross-layer propagation', () => {
  it('recognizes NOT_FOUND from the interactor', async () => {
    const interactor = makeInteractor();
    let caught: unknown;
    try {
      await interactor.get({ appId: GHOST_ID, userId: USER_ID });
    } catch (e) {
      caught = e;
    }
    expect(isAppError(caught)).toBe(true);
    expect((caught as AppError).code).toBe('NOT_FOUND');
  });

  it('recognizes CONFLICT on duplicate create', async () => {
    const interactor = makeInteractor();
    await interactor.create({ name: 'Dup', userId: USER_ID });
    await expect(interactor.create({ name: 'Dup', userId: USER_ID })).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('returns FORBIDDEN for another user app', async () => {
    const interactor = makeInteractor();
    const app = await interactor.create({ name: 'Private', userId: OTHER_USER_ID });
    await expect(interactor.get({ appId: app.id, userId: USER_ID })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('wraps repository failures as REPOSITORY_ERROR', async () => {
    const brokenStorage = createInMemoryStorage();
    Object.defineProperty(brokenStorage, 'apps', {
      get() {
        throw new Error('storage broken');
      },
    });
    const interactor = createAppInteractor({
      appRepository: createInMemoryAppRepository(brokenStorage),
      todoRepository: createInMemoryTodoRepository(createInMemoryStorage()),
    });
    await expect(interactor.list(USER_ID)).rejects.toMatchObject({ code: 'REPOSITORY_ERROR' });
  });
});
