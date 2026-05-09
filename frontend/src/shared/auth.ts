import { atomWithStorage } from 'jotai/utils'

/**
 * Auth state stored in the atom.
 */
export type AuthState = {
  userId: string
  email: string
} | null

/**
 * Atom storing the current authentication state, persisted to localStorage.
 */
export const authAtom = atomWithStorage<AuthState>('auth', null)
