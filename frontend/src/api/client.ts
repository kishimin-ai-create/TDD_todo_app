const BASE_URL: string = (import.meta.env['VITE_API_BASE_URL'] as string) ?? '';

/**
 * Custom fetch wrapper used by orval-generated API client.
 * Prepends VITE_API_BASE_URL to every request and returns the HTTP envelope
 * `{ data, status, headers }` expected by orval-generated response types.
 */
export const customFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${BASE_URL}${url}`, options);

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  return { data, status: response.status, headers: response.headers } as T;
};
