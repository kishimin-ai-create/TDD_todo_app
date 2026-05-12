import { AppError } from '../models/app-error';
import type { CreateAppInput, UpdateAppInput } from '../services/app-usecase';
import type { CreateTodoInput, UpdateTodoInput } from '../services/todo-usecase';

type CreateAppBody = Pick<CreateAppInput, 'name'>;
type UpdateAppBody = Omit<UpdateAppInput, 'userId'>;
type CreateTodoBody = Pick<CreateTodoInput, 'appId' | 'title'>;
type UpdateTodoBody = Omit<UpdateTodoInput, 'userId'>;
import {
  CreateAppRequestSchema,
  UpdateAppRequestSchema,
  CreateTodoRequestSchema,
  UpdateTodoRequestSchema,
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
export function parseCreateAppInput(body: unknown): CreateAppBody {
  const result = CreateAppRequestSchema.safeParse(body);
  if (!result.success) throw toValidationError(result.error.issues);
  return result.data;
}

/**
 * Parses and validates the update-app request body.
 */
export function parseUpdateAppInput(appId: string, body: unknown): UpdateAppBody {
  const result = UpdateAppRequestSchema.safeParse(body ?? {});
  if (!result.success) throw toValidationError(result.error.issues);
  return { appId, ...result.data };
}

/**
 * Parses and validates the create-todo request body.
 */
export function parseCreateTodoInput(appId: string, body: unknown): CreateTodoBody {
  const result = CreateTodoRequestSchema.safeParse(body);
  if (!result.success) throw toValidationError(result.error.issues);
  return { appId, ...result.data };
}

/**
 * Parses and validates the update-todo request body.
 */
export function parseUpdateTodoInput(appId: string, todoId: string, body: unknown): UpdateTodoBody {
  const result = UpdateTodoRequestSchema.safeParse(body ?? {});
  if (!result.success) throw toValidationError(result.error.issues);
  return { appId, todoId, ...result.data };
}
