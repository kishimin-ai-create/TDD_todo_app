import { describe, expect, it } from 'vitest';

import { AppError, isAppError } from './app-error';

describe('AppError', () => {
  it('supports all declared error codes', () => {
    expect(new AppError('VALIDATION_ERROR', 'm').code).toBe('VALIDATION_ERROR');
    expect(new AppError('CONFLICT', 'm').code).toBe('CONFLICT');
    expect(new AppError('NOT_FOUND', 'm').code).toBe('NOT_FOUND');
    expect(new AppError('UNAUTHORIZED', 'm').code).toBe('UNAUTHORIZED');
    expect(new AppError('FORBIDDEN', 'm').code).toBe('FORBIDDEN');
    expect(new AppError('REPOSITORY_ERROR', 'm').code).toBe('REPOSITORY_ERROR');
  });

  it('is recognized by isAppError', () => {
    expect(isAppError(new AppError('NOT_FOUND', 'missing'))).toBe(true);
    expect(isAppError(new Error('plain'))).toBe(false);
  });
});
