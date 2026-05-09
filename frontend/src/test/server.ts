import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { getTDDTodoAppAPIMock } from '../api/generated/index.msw';

/**
 * MSW server shared across all Vitest tests.
 * Handlers are auto-generated from the OpenAPI spec via orval.
 * Auth endpoint handlers are added manually.
 */
export const server = setupServer(
  ...getTDDTodoAppAPIMock(),
  http.post('*/api/v1/auth/signup', () =>
    HttpResponse.json(
      { data: { userId: 'user-1', email: 'test@example.com' }, success: true },
      { status: 201 },
    ),
  ),
  http.post('*/api/v1/auth/login', () =>
    HttpResponse.json(
      { data: { userId: 'user-1', email: 'test@example.com' }, success: true },
    ),
  ),
);
