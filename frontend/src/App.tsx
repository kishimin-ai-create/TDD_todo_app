import { useAtom } from 'jotai'

import { AppCreatePage } from './features/app-create/pages/AppCreatePage'
import { AppDetailPage } from './features/app-detail/pages/AppDetailPage'
import { AppEditPage } from './features/app-edit/pages/AppEditPage'
import { AppListPage } from './features/app-list/pages/AppListPage'
import { LoginPage } from './features/login/pages/LoginPage'
import { useAuth } from './shared/auth'
import { currentPageAtom } from './shared/navigation'

/**
 * Main app component that manages page routing state.
 */
function App() {
  const [currentPage] = useAtom(currentPageAtom)
  const { isLoggedIn } = useAuth()

  if (!isLoggedIn) {
    return <LoginPage />
  }

  return (
    <div>
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
