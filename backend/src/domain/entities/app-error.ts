export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'REPOSITORY_ERROR';

/**
 * Represents an application-level error that can safely cross layers.
 */
export class AppError extends Error {
  public readonly code: AppErrorCode;

  public constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

/**
 * Determines whether a caught value is an AppError instance.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
