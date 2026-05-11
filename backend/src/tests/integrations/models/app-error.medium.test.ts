import { describe, it, expect } from 'vitest';

import { AppError, isAppError } from '../../../models/app-error';
import {
  createInMemoryAppRepository,
  createInMemoryTodoRepository,
} from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import { createAppInteractor } from '../../../services/app-interactor';

const GHOST_ID = '00000000-0000-0000-0000-000000000000';

function makeInteractor() {
  const storage = createInMemoryStorage();
  return createAppInteractor({
    appRepository: createInMemoryAppRepository(storage),
    todoRepository: createInMemoryTodoRepository(storage),
  });
}

// ─── AppError cross-layer propagation ────────────────────────────────────────

describe('AppError cross-layer propagation', () => {
  it('interactor throws AppError with NOT_FOUND and isAppError recognizes it', async () => {
    const interactor = makeInteractor();
    let caught: unknown;
    try {
      await interactor.get({ appId: GHOST_ID });
    } catch (e) {
      caught = e;
    }
    expect(isAppError(caught)).toBe(true);
    // isAppError(caught) is verified true by the assertion above; cast is safe here
    expect((caught as AppError).code).toBe('NOT_FOUND');
  });

  it('interactor throws AppError with CONFLICT on duplicate create', async () => {
    const interactor = makeInteractor();
    await interactor.create({ name: 'Dup' });
    let caught: unknown;
    try {
      await interactor.create({ name: 'Dup' });
    } catch (e) {
      caught = e;
    }
    expect(isAppError(caught)).toBe(true);
    // isAppError(caught) is verified true by the assertion above; cast is safe here
    expect((caught as AppError).code).toBe('CONFLICT');
  });

  it('AppError preserves code and message across layer boundaries', () => {
    const err = new AppError('VALIDATION_ERROR', 'must not be empty');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('must not be empty');
    expect(err.name).toBe('AppError');
    expect(err instanceof Error).toBe(true);
  });

  it('isAppError returns false for a plain Error', () => {
    expect(isAppError(new Error('plain'))).toBe(false);
  });

  it('isAppError returns false for null', () => {
    expect(isAppError(null)).toBe(false);
  });

  it('isAppError returns false for a plain object with a code property', () => {
    expect(isAppError({ code: 'NOT_FOUND', message: 'test' })).toBe(false);
  });

  it('infrastructure wraps unexpected storage errors as REPOSITORY_ERROR', async () => {
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
    let caught: unknown;
    try {
      await interactor.list();
    } catch (e) {
      caught = e;
    }
    expect(isAppError(caught)).toBe(true);
    // isAppError(caught) is verified true by the assertion above; cast is safe here
    expect((caught as AppError).code).toBe('REPOSITORY_ERROR');
  });
});
