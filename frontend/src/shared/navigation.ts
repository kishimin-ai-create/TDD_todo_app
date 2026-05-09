import { atom, useAtom } from 'jotai'

export type Page =
  | { name: 'login' }
  | { name: 'signup' }
  | { name: 'app-list' }
  | { name: 'app-detail'; appId: string }
  | { name: 'app-create' }
  | { name: 'app-edit'; appId: string }

export const currentPageAtom = atom<Page>({ name: 'app-list' })

/**
 * Hook providing navigation functionality for app routing.
 */
export function useNavigation() {
  const [currentPage, setPage] = useAtom(currentPageAtom)

  return {
    currentPage,
    goToLogin: () => setPage({ name: 'login' }),
    goToSignup: () => setPage({ name: 'signup' }),
    goToAppList: () => setPage({ name: 'app-list' }),
    goToAppDetail: (appId: string) => setPage({ name: 'app-detail', appId }),
    goToAppCreate: () => setPage({ name: 'app-create' }),
    goToAppEdit: (appId: string) => setPage({ name: 'app-edit', appId }),
  }
}
