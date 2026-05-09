import { getDefaultStore } from 'jotai'
import { tokenAtom } from '../shared/auth'

const BASE_URL: string = (import.meta.env['VITE_API_BASE_URL'] as string) ?? '';

/**
 * Custom fetch wrapper used by orval-generated API client.
 * Prepends VITE_API_BASE_URL to every request and returns the HTTP envelope
 * `{ data, status, headers }` expected by orval-generated response types.
 * Automatically attaches the JWT token from the auth store when present.
 */
export const customFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const store = getDefaultStore()
  const token = store.get(tokenAtom)

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> | undefined),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  return { data, status: response.status, headers: response.headers } as T;
};
