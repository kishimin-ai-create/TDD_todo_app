import { atomWithStorage } from 'jotai/utils'

/**
 * Atom that persists authentication state to localStorage.
 * When true, the user is logged in.
 */
export const isAuthenticatedAtom = atomWithStorage<boolean>('isAuthenticated', false)
