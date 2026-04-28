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
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status, body });
  }

  return response.json() as Promise<T>;
};
