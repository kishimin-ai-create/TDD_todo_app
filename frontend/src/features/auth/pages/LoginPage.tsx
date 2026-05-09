import { useAtom } from 'jotai'

import { authAtom } from '../../../shared/auth'
import { useNavigation } from '../../../shared/navigation'
import { useAuthForm } from '../hooks/useAuthForm'

/**
 * Login page that allows existing users to authenticate.
 */
export function LoginPage() {
  const [, setAuth] = useAtom(authAtom)
  const { goToSignup, goToAppList } = useNavigation()

  const { email, setEmail, password, setPassword, error, isSubmitting, handleSubmit } = useAuthForm({
    endpoint: '/api/v1/auth/login',
    fallbackErrorMessage: 'Login failed',
    onSuccess: (auth) => { setAuth(auth); goToAppList() },
  })

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <button
        type="button"
        onClick={goToSignup}
        className="mt-4 px-4 py-2 border rounded w-full"
      >
        Sign Up
      </button>
    </div>
  )
}
