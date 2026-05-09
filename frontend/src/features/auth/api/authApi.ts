const BASE_URL: string = (import.meta.env['VITE_API_BASE_URL'] as string) ?? '';

type AuthSuccessData = {
  token: string;
  user: { id: string; email: string };
};

type AuthResponse = {
  success: boolean;
  data?: AuthSuccessData;
  error?: { code: string; message: string };
};

/**
 * Registers a new user with email and password.
 */
export async function register(email: string, password: string): Promise<AuthSuccessData> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json: AuthResponse = await res.json() as AuthResponse;
  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? 'Registration failed');
  }
  return json.data;
}

/**
 * Logs in an existing user with email and password.
 */
export async function login(email: string, password: string): Promise<AuthSuccessData> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json: AuthResponse = await res.json() as AuthResponse;
  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? 'Login failed');
  }
  return json.data;
}
