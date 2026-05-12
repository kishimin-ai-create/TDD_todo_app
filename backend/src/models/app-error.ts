/**
 * Error codes for application errors.
 */
export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'REPOSITORY_ERROR';

/**
 * Represents an application-level error that can safely cross layers.
 */
export class AppError extends Error {
  public readonly code: AppErrorCode;

  /**
   * Creates an AppError instance with the given error code and message.
   * Pass `{ cause: err }` as options to preserve the original error for observability.
   */
  public constructor(code: AppErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
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
