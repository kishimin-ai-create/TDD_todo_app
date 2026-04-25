import { AppError } from '../../domain/entities/app-error';
import type {
  CreateAppInput,
  UpdateAppInput,
} from '../../usecase/input_ports/app-usecase';
import type {
  CreateTodoInput,
  UpdateTodoInput,
} from '../../usecase/input_ports/todo-usecase';

/**
 * Parses and validates the create-app request body.
 */
export function parseCreateAppInput(body: unknown): CreateAppInput {
  const payload = toRecord(body);
  return {
    name: validateName(payload.name),
  };
}

/**
 * Parses and validates the update-app request body.
 */
export function parseUpdateAppInput(
  appId: string,
  body: unknown,
): UpdateAppInput {
  const payload = toRecord(body);
  const input: UpdateAppInput = { appId };

  if (payload.name !== undefined) {
    input.name = validateName(payload.name);
  }

  return input;
}

/**
 * Parses and validates the create-todo request body.
 */
export function parseCreateTodoInput(
  appId: string,
  body: unknown,
): CreateTodoInput {
  const payload = toRecord(body);
  return {
    appId,
    title: validateTitle(payload.title),
  };
}

/**
 * Parses and validates the update-todo request body.
 */
export function parseUpdateTodoInput(
  appId: string,
  todoId: string,
  body: unknown,
): UpdateTodoInput {
  const payload = toRecord(body);
  const input: UpdateTodoInput = { appId, todoId };

  if (payload.title !== undefined) {
    input.title = validateTitle(payload.title);
  }

  if (payload.completed !== undefined) {
    if (typeof payload.completed !== 'boolean') {
      throw new AppError('VALIDATION_ERROR', 'completed must be a boolean');
    }
    input.completed = payload.completed;
  }

  return input;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return value;
}

function validateName(value: unknown): string {
  if (typeof value !== 'string') {
    throw new AppError('VALIDATION_ERROR', 'name is required');
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'name must not be empty');
  }

  if (trimmed.length > 100) {
    throw new AppError(
      'VALIDATION_ERROR',
      'name must be at most 100 characters',
    );
  }

  return trimmed;
}

function validateTitle(value: unknown): string {
  if (typeof value !== 'string') {
    throw new AppError('VALIDATION_ERROR', 'title is required');
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'title must not be empty');
  }

  if (trimmed.length > 200) {
    throw new AppError(
      'VALIDATION_ERROR',
      'title must be at most 200 characters',
    );
  }

  return trimmed;
}
