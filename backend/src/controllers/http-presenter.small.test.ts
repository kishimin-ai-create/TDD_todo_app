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

const sampleApp: AppEntity = {
  id: 'app-uuid-1',
  userId: 'user-1',
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

describe('http presenter', () => {
  it('presentApp omits userId and deletedAt', () => {
    expect(presentApp(sampleApp)).toEqual({
      id: sampleApp.id,
      name: sampleApp.name,
      createdAt: sampleApp.createdAt,
      updatedAt: sampleApp.updatedAt,
    });
  });

  it('presentTodo omits deletedAt', () => {
    expect(presentTodo(sampleTodo)).toEqual({
      id: sampleTodo.id,
      appId: sampleTodo.appId,
      title: sampleTodo.title,
      completed: sampleTodo.completed,
      createdAt: sampleTodo.createdAt,
      updatedAt: sampleTodo.updatedAt,
    });
  });

  it('presentError maps FORBIDDEN to 403', () => {
    expect(presentError(new AppError('FORBIDDEN', 'Access denied')).status).toBe(403);
  });

  it('presentSuccess returns success body', () => {
    const result = presentSuccess({ id: '1' }, 201);
    expect(result.status).toBe(201);
    expect(result.body.success).toBe(true);
  });

  it('handleControllerError returns known app errors and rethrows unknown ones', () => {
    expect(handleControllerError(new AppError('NOT_FOUND', 'missing')).status).toBe(404);
    expect(() => handleControllerError(new Error('unexpected'))).toThrow('unexpected');
  });
});
