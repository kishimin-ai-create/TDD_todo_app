import { useSetAtom } from 'jotai'

import { authAtom } from '../../../shared/auth'
import { currentPageAtom } from '../../../shared/navigation'

/**
 * Hook that provides a logout function.
 * Clears the auth state and navigates to the login page.
 */
export function useLogout() {
  const setAuth = useSetAtom(authAtom)
  const setCurrentPage = useSetAtom(currentPageAtom)

  function logout() {
    setAuth(null)
    setCurrentPage({ name: 'login' })
  }

  return { logout }
}
