import { createBackendRegistry } from './infrastructure/registry';
import { createMysqlBackendRegistry } from './infrastructure/mysql-registry';

const isTest = process.env.NODE_ENV === 'test';

let clearStorageFn: (() => void) | undefined;
let honoApp: ReturnType<typeof createMysqlBackendRegistry>['app'];

if (isTest) {
  const registry = createBackendRegistry();
  honoApp = registry.app;
  clearStorageFn = registry.clearStorage;
} else {
  const registry = createMysqlBackendRegistry();
  honoApp = registry.app;
}

/**
 * Clears the in-memory storage used by the backend during tests.
 */
export function clearStorage(): void {
  clearStorageFn?.();
}

export default honoApp;
