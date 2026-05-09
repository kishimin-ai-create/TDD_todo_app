import { useNavigation } from '../../../shared/navigation'

/**
 * Landing page shown to unauthenticated users with options to log in or sign up.
 */
export function LandingPage() {
  const { goToLogin, goToSignup } = useNavigation()

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-6">Todo App TDD</h1>
      <div className="flex justify-center gap-4">
        <button
          onClick={goToLogin}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login
        </button>
        <button
          onClick={goToSignup}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Sign Up
        </button>
      </div>
    </div>
  )
}
