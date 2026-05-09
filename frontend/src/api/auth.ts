import type { AuthState } from '../shared/auth'

const BASE_URL: string = (import.meta.env['VITE_API_BASE_URL'] as string) ?? ''

type AuthResponse = {
  data: AuthState
  success: boolean
  error?: { code: string; message: string }
}

/**
 * Registers a new user with email and password.
 */
export async function signup(
  email: string,
  password: string,
): Promise<AuthState> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = (await response.json()) as AuthResponse
  if (!body.success || !body.data) {
    throw new Error(body.error?.message ?? 'Signup failed')
  }
  return body.data
}

/**
 * Authenticates a user with email and password.
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthState> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = (await response.json()) as AuthResponse
  if (!body.success || !body.data) {
    throw new Error(body.error?.message ?? 'Login failed')
  }
  return body.data
}
