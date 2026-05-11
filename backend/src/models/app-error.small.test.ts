import { describe, expect, it } from 'vitest';

import { AppError, isAppError } from './app-error';

describe('AppError', () => {
  describe('constructor', () => {
    it('sets the name property to "AppError"', () => {
      const error = new AppError('NOT_FOUND', 'App not found');
      expect(error.name).toBe('AppError');
    });

    it('sets the code property to the given error code', () => {
      const error = new AppError('VALIDATION_ERROR', 'Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('sets the message property to the given message', () => {
      const error = new AppError('CONFLICT', 'Name already exists');
      expect(error.message).toBe('Name already exists');
    });

    it('is an instance of Error', () => {
      const error = new AppError('REPOSITORY_ERROR', 'DB failed');
      expect(error).toBeInstanceOf(Error);
    });

    it('supports all error codes', () => {
      expect(new AppError('VALIDATION_ERROR', 'm').code).toBe('VALIDATION_ERROR');
      expect(new AppError('CONFLICT', 'm').code).toBe('CONFLICT');
      expect(new AppError('NOT_FOUND', 'm').code).toBe('NOT_FOUND');
      expect(new AppError('REPOSITORY_ERROR', 'm').code).toBe('REPOSITORY_ERROR');
    });
  });
});

describe('isAppError', () => {
  it('returns true for an AppError instance', () => {
    const error = new AppError('NOT_FOUND', 'not found');
    expect(isAppError(error)).toBe(true);
  });

  it('returns false for a plain Error', () => {
    const error = new Error('plain error');
    expect(isAppError(error)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isAppError('some error')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAppError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAppError(undefined)).toBe(false);
  });

  it('returns false for a plain object', () => {
    expect(isAppError({ code: 'NOT_FOUND', message: 'x' })).toBe(false);
  });
});
