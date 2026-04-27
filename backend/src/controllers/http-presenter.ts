import { AppError, isAppError } from '../models/app-error';
import type { AppEntity } from '../models/app';
import type { TodoEntity } from '../models/todo';

type ErrorBody = {
  code: string;
  message: string;
};

/**
 * Response body structure for API responses.
 */
export type ApiResponseBody = {
  data: unknown;
  success: boolean;
  error?: ErrorBody;
};

/**
 * JSON HTTP response structure.
 */
export type JsonHttpResponse = {
  status: number;
  body: ApiResponseBody;
};

/**
 * Converts an app entity into the API response DTO.
 */
export function presentApp(app: AppEntity) {
  return {
    id: app.id,
    name: app.name,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  };
}

/**
 * Converts a todo entity into the API response DTO.
 */
export function presentTodo(todo: TodoEntity) {
  return {
    id: todo.id,
    appId: todo.appId,
    title: todo.title,
    completed: todo.completed,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  };
}

/**
 * Builds a successful JSON HTTP response payload.
 */
export function presentSuccess(data: unknown, status = 200): JsonHttpResponse {
  return {
    status,
    body: {
      data,
      success: true,
    },
  };
}

/**
 * Builds a JSON HTTP response payload for a known application error.
 */
export function presentError(error: AppError): JsonHttpResponse {
  return {
    status: statusForErrorCode(error.code),
    body: {
      data: null,
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    },
  };
}

function statusForErrorCode(code: AppError['code']): number {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 422;
    case 'CONFLICT':
      return 409;
    case 'NOT_FOUND':
      return 404;
    case 'REPOSITORY_ERROR':
      return 500;
    default:
      return 500;
  }
}

/**
 * Handles a caught error from a controller action.
 * Returns a JSON HTTP response for known AppErrors; re-throws unknown errors.
 */
export function handleControllerError(error: unknown): JsonHttpResponse {
  if (isAppError(error)) {
    return presentError(error);
  }

  throw error;
}
