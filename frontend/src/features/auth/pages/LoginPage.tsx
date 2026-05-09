import { useAtom } from 'jotai'
import { useState } from 'react'

import { authAtom } from '../../../shared/auth'
import { useNavigation } from '../../../shared/navigation'

type AuthSuccessResponse = {
  success: true
  data: { token: string; user: { id: string; email: string } }
}

type AuthFailResponse = {
  success: false
  error: string
}

type AuthResponse = AuthSuccessResponse | AuthFailResponse

/**
 * Login page that allows existing users to authenticate.
 */
export function LoginPage() {
  const [, setAuth] = useAtom(authAtom)
  const { goToSignup, goToAppList } = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function doLogin() {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await response.json()) as AuthResponse
      if (!response.ok || !data.success) {
        setError(data.success ? 'Login failed' : data.error)
        return
      }
      setAuth(data.data)
      goToAppList()
    } catch {
      setError('An unexpected error occurred')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void doLogin()
  }

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
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
        >
          Login
        </button>
      </form>
      <button
        onClick={goToSignup}
        className="mt-4 px-4 py-2 border rounded w-full"
      >
        Sign Up
      </button>
    </div>
  )
}
