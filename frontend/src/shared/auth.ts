import { atomWithStorage } from 'jotai/utils'

/**
 * Atom storing whether the user is currently authenticated.
 * Persisted in localStorage so the session survives page refreshes.
 */
export const isAuthenticatedAtom = atomWithStorage('isAuthenticated', false)
