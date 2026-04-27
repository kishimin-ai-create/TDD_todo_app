const BASE_URL: string = (import.meta.env['VITE_API_BASE_URL'] as string) ?? '';

/**
 * Custom fetch wrapper used by orval-generated API client.
 * Prepends VITE_API_BASE_URL to every request and handles JSON parsing.
 */
export const customFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${BASE_URL}${url}`, options);

  if (!response.ok) {
    throw (await response.json()) as unknown;
  }

  return response.json() as Promise<T>;
};
