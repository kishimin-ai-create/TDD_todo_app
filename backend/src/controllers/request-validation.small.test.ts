import { describe, expect, it } from 'vitest';

import { AppError } from '../models/app-error';
import {
  parseCreateAppInput,
  parseCreateTodoInput,
  parseUpdateAppInput,
  parseUpdateTodoInput,
} from './request-validation';

// ─── parseCreateAppInput ─────────────────────────────────────────────────────

describe('parseCreateAppInput', () => {
  it('returns CreateAppInput with trimmed name for valid input', () => {
    const result = parseCreateAppInput({ name: 'My App' });
    expect(result).toEqual({ name: 'My App' });
  });

  it('trims surrounding whitespace from name', () => {
    const result = parseCreateAppInput({ name: '  Trimmed  ' });
    expect(result.name).toBe('Trimmed');
  });

  it('accepts a name exactly 100 characters long', () => {
    const name = 'a'.repeat(100);
    expect(parseCreateAppInput({ name }).name).toBe(name);
  });

  it('throws VALIDATION_ERROR when name is missing', () => {
    expect(() => parseCreateAppInput({})).toThrow(AppError);
    expect(() => parseCreateAppInput({})).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws VALIDATION_ERROR when name is not a string', () => {
    expect(() => parseCreateAppInput({ name: 42 })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws VALIDATION_ERROR when name is empty string', () => {
    expect(() => parseCreateAppInput({ name: '' })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws VALIDATION_ERROR when name is whitespace only', () => {
    expect(() => parseCreateAppInput({ name: '   ' })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws VALIDATION_ERROR when name exceeds 100 characters', () => {
    expect(() =>
      parseCreateAppInput({ name: 'a'.repeat(101) }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });

  it('returns empty record when body is not an object', () => {
    expect(() => parseCreateAppInput(null)).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
    expect(() => parseCreateAppInput('string')).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
    expect(() => parseCreateAppInput([])).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });
});

// ─── parseUpdateAppInput ─────────────────────────────────────────────────────

describe('parseUpdateAppInput', () => {
  it('returns UpdateAppInput with appId and trimmed name', () => {
    const result = parseUpdateAppInput('app-1', { name: 'New Name' });
    expect(result).toEqual({ appId: 'app-1', name: 'New Name' });
  });

  it('returns UpdateAppInput with only appId when name is not provided', () => {
    const result = parseUpdateAppInput('app-1', {});
    expect(result).toEqual({ appId: 'app-1' });
  });

  it('does not include name key when body has no name', () => {
    const result = parseUpdateAppInput('app-1', {});
    expect('name' in result).toBe(false);
  });

  it('throws VALIDATION_ERROR when name is empty string', () => {
    expect(() => parseUpdateAppInput('app-1', { name: '' })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws VALIDATION_ERROR when name is whitespace only', () => {
    expect(() => parseUpdateAppInput('app-1', { name: '   ' })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws VALIDATION_ERROR when name exceeds 100 characters', () => {
    expect(() =>
      parseUpdateAppInput('app-1', { name: 'b'.repeat(101) }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });
});

// ─── parseCreateTodoInput ────────────────────────────────────────────────────

describe('parseCreateTodoInput', () => {
  it('returns CreateTodoInput with appId and trimmed title', () => {
    const result = parseCreateTodoInput('app-1', { title: 'My Todo' });
    expect(result).toEqual({ appId: 'app-1', title: 'My Todo' });
  });

  it('trims surrounding whitespace from title', () => {
    const result = parseCreateTodoInput('app-1', { title: '  Buy milk  ' });
    expect(result.title).toBe('Buy milk');
  });

  it('accepts a title exactly 200 characters long', () => {
    const title = 'c'.repeat(200);
    expect(parseCreateTodoInput('app-1', { title }).title).toBe(title);
  });

  it('throws VALIDATION_ERROR when title is missing', () => {
    expect(() => parseCreateTodoInput('app-1', {})).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws VALIDATION_ERROR when title is not a string', () => {
    expect(() => parseCreateTodoInput('app-1', { title: true })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws VALIDATION_ERROR when title is empty string', () => {
    expect(() => parseCreateTodoInput('app-1', { title: '' })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws VALIDATION_ERROR when title is whitespace only', () => {
    expect(() => parseCreateTodoInput('app-1', { title: '   ' })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws VALIDATION_ERROR when title exceeds 200 characters', () => {
    expect(() =>
      parseCreateTodoInput('app-1', { title: 'c'.repeat(201) }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });
});

// ─── parseUpdateTodoInput ────────────────────────────────────────────────────

describe('parseUpdateTodoInput', () => {
  it('returns UpdateTodoInput with appId, todoId, and trimmed title', () => {
    const result = parseUpdateTodoInput('app-1', 'todo-1', { title: 'Updated' });
    expect(result).toEqual({ appId: 'app-1', todoId: 'todo-1', title: 'Updated' });
  });

  it('returns UpdateTodoInput with completed field', () => {
    const result = parseUpdateTodoInput('app-1', 'todo-1', { completed: true });
    expect(result).toEqual({ appId: 'app-1', todoId: 'todo-1', completed: true });
  });

  it('accepts completed: false', () => {
    const result = parseUpdateTodoInput('app-1', 'todo-1', { completed: false });
    expect(result.completed).toBe(false);
  });

  it('returns base input when body has no fields', () => {
    const result = parseUpdateTodoInput('app-1', 'todo-1', {});
    expect(result).toEqual({ appId: 'app-1', todoId: 'todo-1' });
  });

  it('throws VALIDATION_ERROR when title is empty', () => {
    expect(() =>
      parseUpdateTodoInput('app-1', 'todo-1', { title: '' }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });

  it('throws VALIDATION_ERROR when title is whitespace only', () => {
    expect(() =>
      parseUpdateTodoInput('app-1', 'todo-1', { title: '   ' }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });

  it('throws VALIDATION_ERROR when title exceeds 200 characters', () => {
    expect(() =>
      parseUpdateTodoInput('app-1', 'todo-1', { title: 'd'.repeat(201) }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });

  it('throws VALIDATION_ERROR when completed is not a boolean', () => {
    expect(() =>
      parseUpdateTodoInput('app-1', 'todo-1', { completed: 'yes' }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });

  it('throws VALIDATION_ERROR when completed is a number', () => {
    expect(() =>
      parseUpdateTodoInput('app-1', 'todo-1', { completed: 1 }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });
});
