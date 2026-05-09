import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

/**
 * Atom that persists the JWT token in localStorage.
 * Null means the user is not authenticated.
 */
export const tokenAtom = atomWithStorage<string | null>('auth_token', null)

/**
 * Derived atom that returns true when the user is authenticated.
 */
export const isAuthenticatedAtom = atom(
  (get) => get(tokenAtom) !== null,
)
