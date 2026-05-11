import { createBackendRegistry } from './infrastructure/registry';
import { createMysqlBackendRegistry } from './infrastructure/mysql-registry';
import type { Hono } from 'hono';

type ResolvedApp = {
  app: Hono;
  clearStorage?: () => void;
};

/**
 * Resolves the appropriate backend registry based on the current environment.
 * Uses MySQL when database configuration is present; falls back to in-memory otherwise.
 */
export function resolveApp(): ResolvedApp {
  const isTest = process.env.NODE_ENV === 'test';
  const hasDatabaseConfig = !!(process.env.DATABASE_URL || process.env.DB_USERNAME);

  if (!isTest && hasDatabaseConfig) {
    return createMysqlBackendRegistry();
  }

  return createBackendRegistry();
}

const { app: honoApp, clearStorage: clearStorageFn } = resolveApp();

/**
 * Clears the in-memory storage used by the backend during tests.
 */
export function clearStorage(): void {
  clearStorageFn?.();
}

export default honoApp;
