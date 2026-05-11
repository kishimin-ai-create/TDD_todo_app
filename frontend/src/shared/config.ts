/** Base URL for API requests. Empty string in local dev (Vite proxy handles it). */
export const API_BASE_URL = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? ''
