import { createBackendRegistry } from './infrastructure/framework/registry';

const registry = createBackendRegistry();

/**
 * Clears the in-memory storage used by the backend during tests.
 */
export function clearStorage(): void {
  registry.clearStorage();
}

export default registry.app;
