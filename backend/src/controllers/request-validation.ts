import { AppError } from '../models/app-error';
import type { CreateAppInput, UpdateAppInput } from '../services/app-usecase';
import type { CreateTodoInput, UpdateTodoInput } from '../services/todo-usecase';
import type { RegisterInput, LoginInput } from '../services/auth-usecase';
import {
  CreateAppRequestSchema,
  UpdateAppRequestSchema,
  CreateTodoRequestSchema,
  UpdateTodoRequestSchema,
  RegisterRequestSchema,
  LoginRequestSchema,
} from './schemas';

function toValidationError(issues: { message: string }[]): AppError {
  return new AppError(
    'VALIDATION_ERROR',
    issues[0]?.message ?? 'Invalid request body',
  );
}

/**
 * Parses and validates the create-app request body.
 */
export function parseCreateAppInput(userId: string, body: unknown): CreateAppInput {
  const result = CreateAppRequestSchema.safeParse(body);
  if (!result.success) throw toValidationError(result.error.issues);
  return { userId, ...result.data };
}

/**
 * Parses and validates the update-app request body.
 */
export function parseUpdateAppInput(userId: string, appId: string, body: unknown): UpdateAppInput {
  const result = UpdateAppRequestSchema.safeParse(body ?? {});
  if (!result.success) throw toValidationError(result.error.issues);
  return { userId, appId, ...result.data };
}

/**
 * Parses and validates the create-todo request body.
 */
export function parseCreateTodoInput(appId: string, body: unknown): CreateTodoInput {
  const result = CreateTodoRequestSchema.safeParse(body);
  if (!result.success) throw toValidationError(result.error.issues);
  return { appId, ...result.data };
}

/**
 * Parses and validates the update-todo request body.
 */
export function parseUpdateTodoInput(appId: string, todoId: string, body: unknown): UpdateTodoInput {
  const result = UpdateTodoRequestSchema.safeParse(body ?? {});
  if (!result.success) throw toValidationError(result.error.issues);
  return { appId, todoId, ...result.data };
}

/**
 * Parses and validates the register request body.
 */
export function parseRegisterInput(body: unknown): RegisterInput {
  const result = RegisterRequestSchema.safeParse(body);
  if (!result.success) throw toValidationError(result.error.issues);
  return result.data;
}

/**
 * Parses and validates the login request body.
 */
export function parseLoginInput(body: unknown): LoginInput {
  const result = LoginRequestSchema.safeParse(body);
  if (!result.success) throw toValidationError(result.error.issues);
  return result.data;
}
