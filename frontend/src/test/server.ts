import { setupServer } from 'msw/node';

import { getTDDTodoAppAPIMock } from '../api/generated/index.msw';

/**
 * MSW server shared across all Vitest tests.
 * Handlers are auto-generated from the OpenAPI spec via orval.
 */
export const server = setupServer(...getTDDTodoAppAPIMock());
