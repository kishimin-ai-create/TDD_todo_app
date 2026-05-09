import { atomWithStorage } from 'jotai/utils'

export type AuthState = {
  token: string
  user: { id: string; email: string }
}

export const authAtom = atomWithStorage<AuthState | null>('auth', null)
