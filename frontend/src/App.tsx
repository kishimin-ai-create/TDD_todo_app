import { useAtom, useSetAtom } from 'jotai'

import { AppCreatePage } from './features/app-create/pages/AppCreatePage'
import { AppDetailPage } from './features/app-detail/pages/AppDetailPage'
import { AppEditPage } from './features/app-edit/pages/AppEditPage'
import { AppListPage } from './features/app-list/pages/AppListPage'
import { AuthPage } from './features/auth/pages/AuthPage'
import { isAuthenticatedAtom, tokenAtom } from './shared/auth'
import { currentPageAtom } from './shared/navigation'

/**
 * Main app component that manages page routing state.
 */
function App() {
  const [currentPage] = useAtom(currentPageAtom)
  const [isAuthenticated] = useAtom(isAuthenticatedAtom)
  const setToken = useSetAtom(tokenAtom)

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return (
    <div>
      <div className="flex justify-end px-6 pt-4">
        <button
          onClick={() => setToken(null)}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Log out
        </button>
      </div>
      <AppListPage />
      {currentPage.name === 'app-detail' && (
        <AppDetailPage appId={currentPage.appId} />
      )}
      {currentPage.name === 'app-create' && <AppCreatePage />}
      {currentPage.name === 'app-edit' && (
        <AppEditPage appId={currentPage.appId} />
      )}
    </div>
  )
}

export default App
