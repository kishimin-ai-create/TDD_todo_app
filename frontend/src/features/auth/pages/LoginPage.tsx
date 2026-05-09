import { useSetAtom } from 'jotai'
import { useState } from 'react'

import { isAuthenticatedAtom } from '../../../shared/auth'
import { useNavigation } from '../../../shared/navigation'

/**
 * Login page for authenticating existing users.
 */
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const setIsAuthenticated = useSetAtom(isAuthenticatedAtom)
  const { goToAppList, goToSignup } = useNavigation()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(undefined)
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setIsAuthenticated(true)
    goToAppList()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Login</h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium mb-1">
              Email *
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Email"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium mb-1">
              Password *
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Password"
            />
          </div>

          {error && (
            <p role="alert" className="text-red-500 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 transition-colors duration-150 font-medium"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          {"Don't have an account? "}
          <button
            onClick={goToSignup}
            className="text-blue-500 hover:underline font-medium"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}
