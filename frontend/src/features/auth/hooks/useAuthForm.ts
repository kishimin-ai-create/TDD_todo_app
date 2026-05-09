import { useState } from 'react'

import type { AuthState } from '../../../shared/auth'

type AuthSuccessResponse = {
  success: true
  data: AuthState
}

type AuthFailResponse = {
  success: false
  error: string
}

type AuthResponse = AuthSuccessResponse | AuthFailResponse

type UseAuthFormOptions = {
  endpoint: string
  fallbackErrorMessage: string
  onSuccess: (auth: AuthState) => void
}

/**
 * Shared hook for authentication form state and submission logic.
 * Used by both LoginPage and SignupPage.
 */
export function useAuthForm({ endpoint, fallbackErrorMessage, onSuccess }: UseAuthFormOptions) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submitAuthRequest() {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await response.json()) as AuthResponse
      if (!response.ok || !data.success) {
        setError(data.success ? fallbackErrorMessage : data.error)
        return
      }
      onSuccess(data.data)
    } catch {
      setError('An unexpected error occurred')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submitAuthRequest()
  }

  return { email, setEmail, password, setPassword, error, handleSubmit }
}
