import { useSetAtom } from 'jotai'
import { useState } from 'react'

import { isAuthenticatedAtom } from '../../../shared/auth'
import { useNavigation } from '../../../shared/navigation'

/**
 * Signup page for registering new users.
 */
export function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string>()
  const setIsAuthenticated = useSetAtom(isAuthenticatedAtom)
  const { goToAppList, goToLogin } = useNavigation()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(undefined)
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsAuthenticated(true)
    goToAppList()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Sign Up</h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium mb-1">
              Email *
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Email"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium mb-1">
              Password *
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Password"
            />
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="block text-sm font-medium mb-1">
              Confirm Password *
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Confirm Password"
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
            Sign Up
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          {'Already have an account? '}
          <button
            onClick={goToLogin}
            className="text-blue-500 hover:underline font-medium"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  )
}
