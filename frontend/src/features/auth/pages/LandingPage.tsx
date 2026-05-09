import { useNavigation } from '../../../shared/navigation'

/**
 * Landing page shown to unauthenticated users.
 * Provides navigation to login and signup but does not allow creating todos.
 */
export function LandingPage() {
  const { goToLogin, goToSignup } = useNavigation()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Todo App TDD</h1>
        <p className="text-lg text-gray-600">
          Manage your todos efficiently. Sign in to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={goToLogin}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg text-lg font-medium hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 transition-colors duration-150"
          >
            Login
          </button>
          <button
            onClick={goToSignup}
            className="px-8 py-3 bg-white text-blue-500 border border-blue-500 rounded-lg text-lg font-medium hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 transition-colors duration-150"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  )
}
