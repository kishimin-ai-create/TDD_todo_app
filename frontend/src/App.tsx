import { useAtom } from 'jotai'
import { useState } from 'react'

import { AppCreatePage } from './features/app-create/pages/AppCreatePage'
import { AppDetailPage } from './features/app-detail/pages/AppDetailPage'
import { AppEditPage } from './features/app-edit/pages/AppEditPage'
import { AppListPage } from './features/app-list/pages/AppListPage'
import { LoginPage } from './features/auth/pages/LoginPage'
import { SignupPage } from './features/auth/pages/SignupPage'
import { isAuthenticatedAtom } from './shared/auth'
import { currentPageAtom } from './shared/navigation'

/**
 * Main app component that manages page routing state and authentication.
 */
function App() {
  const [currentPage] = useAtom(currentPageAtom)
  const [isAuthenticated] = useAtom(isAuthenticatedAtom)
  const [showSignup, setShowSignup] = useState(false)

  if (!isAuthenticated) {
    if (showSignup) {
      return <SignupPage onGoToLogin={() => setShowSignup(false)} />
    }
    return <LoginPage onGoToSignup={() => setShowSignup(true)} />
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
