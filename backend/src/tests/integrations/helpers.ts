import app, { clearStorage } from '../../index';

export { clearStorage };

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Ghost app ID for testing.
 */
export const GHOST_APP_ID = '00000000-0000-0000-0000-000000000000';
/**
 * Ghost todo ID for testing.
 */
export const GHOST_TODO_ID = '11111111-1111-1111-1111-111111111111';
/**
 * Regex to validate UUID format.
 */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * Regex to validate ISO8601 datetime format.
 */
export const ISO8601_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export type AuthSession = {
  token: string;
  user: { id: string; email: string };
};

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

/**
 * Makes an HTTP request to the app.
 */
export const request = (
  method: string,
  path: string,
  body?: unknown,
  token?: string,
) => {
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return app.request(`http://localhost${path}`, {
    method,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

// ─── Factory Helpers ──────────────────────────────────────────────────────────

/**
 * Creates an authenticated user session via signup.
 */
export async function createUserSession(
  email = `user-${crypto.randomUUID()}@example.com`,
  password = 'password123',
): Promise<AuthSession> {
  const res = await request('POST', '/api/v1/auth/signup', { email, password });
  const json = await res.json() as { data: AuthSession; success: boolean };
  return json.data;
}

/**
 * Creates an app with the given name.
 */
export async function createApp(name: string, token: string) {
  const res = await request('POST', '/api/v1/apps', { name }, token);
  const json = await res.json() as { data: { id: string; name: string; createdAt: string; updatedAt: string }; success: boolean };
  return json.data;
}

/**
 * Creates a todo with the given app ID and title.
 */
export async function createTodo(appId: string, title: string, token: string) {
  const res = await request('POST', `/api/v1/apps/${appId}/todos`, { title }, token);
  const json = await res.json() as { data: { id: string; appId: string; title: string; completed: boolean; createdAt: string; updatedAt: string }; success: boolean };
  return json.data;
}
