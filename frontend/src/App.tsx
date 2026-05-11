import { useAtom } from 'jotai'

import { AppCreatePage } from './features/app-create/pages/AppCreatePage'
import { AppDetailPage } from './features/app-detail/pages/AppDetailPage'
import { AppEditPage } from './features/app-edit/pages/AppEditPage'
import { AppListPage } from './features/app-list/pages/AppListPage'
import { LogoutButton } from './features/auth/components/LogoutButton'
import { LandingPage } from './features/auth/pages/LandingPage'
import { LoginPage } from './features/auth/pages/LoginPage'
import { SignupPage } from './features/auth/pages/SignupPage'
import { UserProfilePage } from './features/auth/pages/UserProfilePage'
import { authAtom } from './shared/auth'
import { currentPageAtom, useNavigation } from './shared/navigation'

/**
 * Main app component that manages page routing and authentication state.
 */
function App() {
  const [auth] = useAtom(authAtom)
  const [currentPage] = useAtom(currentPageAtom)
  const { goToUserProfile } = useNavigation()

  if (!auth) {
    if (currentPage.name === 'signup') return <SignupPage key="signup" />
    if (currentPage.name === 'login') return <LoginPage key="login" />
    return <LandingPage />
  }

  if (currentPage.name === 'user-profile') {
    return <UserProfilePage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* App title */}
          <span className="text-base font-semibold tracking-tight text-gray-800">
            Todo App
          </span>

          {/* Right-side actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToUserProfile}
              aria-label="プロフィールページへ移動"
              className="flex items-center gap-1.5 rounded bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:bg-blue-200 transition-colors duration-150"
            >
              {/* Inline user icon (SVG, no extra dependency) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
              プロフィール
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <AppListPage />
        {currentPage.name === 'app-detail' && (
          <AppDetailPage appId={currentPage.appId} />
        )}
        {currentPage.name === 'app-create' && <AppCreatePage />}
        {currentPage.name === 'app-edit' && (
          <AppEditPage appId={currentPage.appId} />
        )}
      </main>
    </div>
  )
}

export default App
