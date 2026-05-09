import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const isLoggedInAtom = atomWithStorage<boolean>('isLoggedIn', false, {
  getItem: (key, initialValue) => {
    try {
      const item = sessionStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as boolean) : initialValue
    } catch {
      return initialValue
    }
  },
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
  },
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key)
    } catch {
      // ignore
    }
  },
  subscribe: () => () => {},
})

/**
 * Hook providing login/logout functionality.
 */
export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useAtom(isLoggedInAtom)

  return {
    isLoggedIn,
    login: () => setIsLoggedIn(true),
    logout: () => setIsLoggedIn(false),
  }
}
