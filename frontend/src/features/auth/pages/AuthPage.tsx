import { useSetAtom } from 'jotai'
import { useState } from 'react'

import { tokenAtom } from '../../../shared/auth'
import { login, register } from '../api/authApi'
import { LoginForm } from '../components/LoginForm'
import { RegisterForm } from '../components/RegisterForm'

type AuthMode = 'login' | 'register'

/**
 * Authentication page that handles both login and registration.
 */
export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [error, setError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const setToken = useSetAtom(tokenAtom)

  async function handleLogin(email: string, password: string) {
    setError(undefined)
    setIsLoading(true)
    try {
      const result = await login(email, password)
      setToken(result.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRegister(email: string, password: string) {
    setError(undefined)
    setIsLoading(true)
    try {
      const result = await register(email, password)
      setToken(result.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Todo App TDD</h1>

        {mode === 'login' ? (
          <LoginForm
            onSubmit={handleLogin}
            onSwitchToRegister={() => { setMode('register'); setError(undefined) }}
            error={error}
            isLoading={isLoading}
          />
        ) : (
          <RegisterForm
            onSubmit={handleRegister}
            onSwitchToLogin={() => { setMode('login'); setError(undefined) }}
            error={error}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}
