import { describe, it, expect } from 'vitest';

import {
  parseCreateAppInput,
  parseUpdateAppInput,
  parseCreateTodoInput,
  parseUpdateTodoInput,
} from '../../../controllers/request-validation';

const APP_ID = 'app-123';
const TODO_ID = 'todo-456';
const USER_ID = 'user-789';

describe('RequestValidation integration', () => {
  // ─── parseCreateAppInput ─────────────────────────────────────────────────

  describe('parseCreateAppInput', () => {
    it('returns CreateAppInput with trimmed name', () => {
      expect(parseCreateAppInput(USER_ID, { name: '  My App  ' })).toEqual({ userId: USER_ID, name: 'My App' });
    });

    it('throws VALIDATION_ERROR when name is missing', () => {
      expect(() => parseCreateAppInput(USER_ID, {})).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws VALIDATION_ERROR when name is a number', () => {
      expect(() => parseCreateAppInput(USER_ID, { name: 42 })).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws VALIDATION_ERROR when name is whitespace only', () => {
      expect(() => parseCreateAppInput(USER_ID, { name: '   ' })).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws VALIDATION_ERROR when name exceeds 100 characters', () => {
      expect(() => parseCreateAppInput(USER_ID, { name: 'a'.repeat(101) })).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('accepts a name of exactly 100 characters', () => {
      const result = parseCreateAppInput(USER_ID, { name: 'a'.repeat(100) });
      expect(result.name).toHaveLength(100);
    });

    it('returns empty name from null body (null → empty record)', () => {
      expect(() => parseCreateAppInput(USER_ID, null)).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws VALIDATION_ERROR when body is an array', () => {
      expect(() => parseCreateAppInput(USER_ID, [{ name: 'x' }])).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });
  });

  // ─── parseUpdateAppInput ─────────────────────────────────────────────────

  describe('parseUpdateAppInput', () => {
    it('returns UpdateAppInput with userId and appId only when body is empty', () => {
      expect(parseUpdateAppInput(USER_ID, APP_ID, {})).toEqual({ userId: USER_ID, appId: APP_ID });
    });

    it('includes trimmed name when provided', () => {
      expect(parseUpdateAppInput(USER_ID, APP_ID, { name: '  New  ' })).toEqual({
        userId: USER_ID,
        appId: APP_ID,
        name: 'New',
      });
    });

    it('throws VALIDATION_ERROR when name is an empty string', () => {
      expect(() => parseUpdateAppInput(USER_ID, APP_ID, { name: '' })).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws VALIDATION_ERROR when name is not a string', () => {
      expect(() => parseUpdateAppInput(USER_ID, APP_ID, { name: true })).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws VALIDATION_ERROR when name exceeds 100 characters', () => {
      expect(() => parseUpdateAppInput(USER_ID, APP_ID, { name: 'a'.repeat(101) })).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('ignores unknown extra fields', () => {
      const result = parseUpdateAppInput(USER_ID, APP_ID, { name: 'Valid', extra: true });
      expect(result).toEqual({ userId: USER_ID, appId: APP_ID, name: 'Valid' });
    });
  });

  // ─── parseCreateTodoInput ────────────────────────────────────────────────

  describe('parseCreateTodoInput', () => {
    it('returns CreateTodoInput with appId and trimmed title', () => {
      expect(parseCreateTodoInput(APP_ID, { title: '  My Todo  ' })).toEqual({
        appId: APP_ID,
        title: 'My Todo',
      });
    });

    it('throws VALIDATION_ERROR when title is missing', () => {
      expect(() => parseCreateTodoInput(APP_ID, {})).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws VALIDATION_ERROR when title is a number', () => {
      expect(() => parseCreateTodoInput(APP_ID, { title: 99 })).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws VALIDATION_ERROR when title is whitespace only', () => {
      expect(() => parseCreateTodoInput(APP_ID, { title: '   ' })).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws VALIDATION_ERROR when title exceeds 200 characters', () => {
      expect(() => parseCreateTodoInput(APP_ID, { title: 'a'.repeat(201) })).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('accepts a title of exactly 200 characters', () => {
      const result = parseCreateTodoInput(APP_ID, { title: 'a'.repeat(200) });
      expect(result.title).toHaveLength(200);
    });

    it('preserves the appId in the returned input', () => {
      const result = parseCreateTodoInput('my-app', { title: 'T' });
      expect(result.appId).toBe('my-app');
    });
  });

  // ─── parseUpdateTodoInput ────────────────────────────────────────────────

  describe('parseUpdateTodoInput', () => {
    it('returns UpdateTodoInput with appId and todoId only when body is empty', () => {
      expect(parseUpdateTodoInput(APP_ID, TODO_ID, {})).toEqual({
        appId: APP_ID,
        todoId: TODO_ID,
      });
    });

    it('includes trimmed title when provided', () => {
      expect(parseUpdateTodoInput(APP_ID, TODO_ID, { title: '  New  ' })).toEqual({
        appId: APP_ID,
        todoId: TODO_ID,
        title: 'New',
      });
    });

    it('includes completed when provided as boolean true', () => {
      expect(parseUpdateTodoInput(APP_ID, TODO_ID, { completed: true })).toMatchObject({
        completed: true,
      });
    });

    it('includes completed when provided as boolean false', () => {
      expect(parseUpdateTodoInput(APP_ID, TODO_ID, { completed: false })).toMatchObject({
        completed: false,
      });
    });

    it('throws VALIDATION_ERROR when completed is a string', () => {
      expect(() => parseUpdateTodoInput(APP_ID, TODO_ID, { completed: 'yes' })).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws VALIDATION_ERROR when title is an empty string', () => {
      expect(() => parseUpdateTodoInput(APP_ID, TODO_ID, { title: '' })).toThrow(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws VALIDATION_ERROR when title exceeds 200 characters', () => {
      expect(() =>
        parseUpdateTodoInput(APP_ID, TODO_ID, { title: 'a'.repeat(201) }),
      ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    });

    it('accepts both title and completed together', () => {
      const result = parseUpdateTodoInput(APP_ID, TODO_ID, {
        title: 'Done',
        completed: true,
      });
      expect(result).toMatchObject({ title: 'Done', completed: true });
    });

    it('ignores unknown extra fields', () => {
      const result = parseUpdateTodoInput(APP_ID, TODO_ID, { extra: 'junk' });
      expect(result).toEqual({ appId: APP_ID, todoId: TODO_ID });
    });
  });
});
