import { describe, expect, it } from 'vitest';

import { AppError } from '../models/app-error';
import type { AppEntity } from '../models/app';
import type { TodoEntity } from '../models/todo';
import {
  handleControllerError,
  presentApp,
  presentError,
  presentSuccess,
  presentTodo,
} from './http-presenter';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sampleApp: AppEntity = {
  id: 'app-uuid-1',
  userId: 'user-presenter-unit',
  name: 'Test App',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  deletedAt: null,
};

const sampleTodo: TodoEntity = {
  id: 'todo-uuid-1',
  appId: 'app-uuid-1',
  title: 'Test Todo',
  completed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  deletedAt: null,
};

// ─── presentApp ──────────────────────────────────────────────────────────────

describe('presentApp', () => {
  it('returns the correct DTO fields', () => {
    const dto = presentApp(sampleApp);
    expect(dto).toEqual({
      id: 'app-uuid-1',
      name: 'Test App',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
  });

  it('does not include deletedAt in the output', () => {
    const dto = presentApp(sampleApp);
    expect('deletedAt' in dto).toBe(false);
  });

  it('works when deletedAt has a value on the entity', () => {
    const deleted = { ...sampleApp, deletedAt: '2024-03-01T00:00:00.000Z' };
    const dto = presentApp(deleted);
    expect('deletedAt' in dto).toBe(false);
  });
});

// ─── presentTodo ─────────────────────────────────────────────────────────────

describe('presentTodo', () => {
  it('returns the correct DTO fields', () => {
    const dto = presentTodo(sampleTodo);
    expect(dto).toEqual({
      id: 'todo-uuid-1',
      appId: 'app-uuid-1',
      title: 'Test Todo',
      completed: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
  });

  it('does not include deletedAt in the output', () => {
    const dto = presentTodo(sampleTodo);
    expect('deletedAt' in dto).toBe(false);
  });

  it('reflects completed: true', () => {
    const completed = { ...sampleTodo, completed: true };
    expect(presentTodo(completed).completed).toBe(true);
  });
});

// ─── presentSuccess ──────────────────────────────────────────────────────────

describe('presentSuccess', () => {
  it('defaults to status 200', () => {
    const result = presentSuccess({ id: '1' });
    expect(result.status).toBe(200);
  });

  it('uses the provided status code', () => {
    const result = presentSuccess({ id: '1' }, 201);
    expect(result.status).toBe(201);
  });

  it('sets success to true', () => {
    const result = presentSuccess(null);
    expect(result.body.success).toBe(true);
  });

  it('passes through the data payload', () => {
    const data = { id: 'x', name: 'y' };
    const result = presentSuccess(data);
    expect(result.body.data).toEqual(data);
  });

  it('does not include an error field', () => {
    const result = presentSuccess({});
    expect(result.body.error).toBeUndefined();
  });
});

// ─── presentError ────────────────────────────────────────────────────────────

describe('presentError', () => {
  it('maps VALIDATION_ERROR to status 422', () => {
    const result = presentError(new AppError('VALIDATION_ERROR', 'bad input'));
    expect(result.status).toBe(422);
  });

  it('maps CONFLICT to status 409', () => {
    const result = presentError(new AppError('CONFLICT', 'duplicate'));
    expect(result.status).toBe(409);
  });

  it('maps NOT_FOUND to status 404', () => {
    const result = presentError(new AppError('NOT_FOUND', 'missing'));
    expect(result.status).toBe(404);
  });

  it('maps REPOSITORY_ERROR to status 500', () => {
    const result = presentError(new AppError('REPOSITORY_ERROR', 'db error'));
    expect(result.status).toBe(500);
  });

  it('sets success to false', () => {
    const result = presentError(new AppError('NOT_FOUND', 'x'));
    expect(result.body.success).toBe(false);
  });

  it('sets data to null', () => {
    const result = presentError(new AppError('NOT_FOUND', 'x'));
    expect(result.body.data).toBeNull();
  });

  it('includes the error code and message in the body', () => {
    const error = new AppError('CONFLICT', 'Name already taken');
    const result = presentError(error);
    expect(result.body.error).toEqual({
      code: 'CONFLICT',
      message: 'Name already taken',
    });
  });
});

// ─── handleControllerError ───────────────────────────────────────────────────

describe('handleControllerError', () => {
  it('returns a JSON response for a known AppError', () => {
    const error = new AppError('NOT_FOUND', 'resource missing');
    const result = handleControllerError(error);
    expect(result.status).toBe(404);
    expect(result.body.success).toBe(false);
    expect(result.body.error?.code).toBe('NOT_FOUND');
  });

  it('re-throws unknown errors', () => {
    const unknown = new Error('unexpected');
    expect(() => handleControllerError(unknown)).toThrow('unexpected');
  });
});
