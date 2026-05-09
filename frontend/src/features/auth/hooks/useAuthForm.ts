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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const extractErrorMessage = (value: unknown): string | null => {
  if (!isRecord(value)) return null

  if (typeof value.error === 'string' && value.error.trim().length > 0) {
    return value.error
  }

  if (isRecord(value.error) && typeof value.error.message === 'string') {
    const message = value.error.message.trim()
    return message.length > 0 ? message : null
  }

  return null
}

const parseAuthResponse = (value: unknown): AuthResponse | null => {
  if (!isRecord(value) || typeof value.success !== 'boolean') return null

  if (value.success) {
    if (!isRecord(value.data)) return null
    if (
      typeof value.data.token !== 'string' ||
      !isRecord(value.data.user) ||
      typeof value.data.user.id !== 'string' ||
      typeof value.data.user.email !== 'string'
    ) {
      return null
    }

    return {
      success: true,
      data: {
        token: value.data.token,
        user: {
          id: value.data.user.id,
          email: value.data.user.email,
        },
      },
    }
  }

  if (typeof value.error !== 'string') return null

  return { success: false, error: value.error }
}

/**
 * Shared hook for authentication form state and submission logic.
 * Used by both LoginPage and SignupPage.
 */
export function useAuthForm({ endpoint, fallbackErrorMessage, onSuccess }: UseAuthFormOptions) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitAuthRequest() {
    if (isSubmitting) return

    if (!email.trim() || !password) {
      setError('Email and password are required')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      let responseBody: unknown = null
      const responseText = await response.text()
      if (responseText.trim().length > 0) {
        try {
          responseBody = JSON.parse(responseText) as unknown
        } catch {
          responseBody = null
        }
      }

      if (!response.ok) {
        setError(extractErrorMessage(responseBody) ?? fallbackErrorMessage)
        return
      }

      const authResponse = parseAuthResponse(responseBody)
      if (!authResponse) {
        setError(fallbackErrorMessage)
        return
      }

      if (!authResponse.success) {
        setError(authResponse.error)
        return
      }

      onSuccess(authResponse.data)
    } catch {
      setError('Unable to reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submitAuthRequest()
  }

  return { email, setEmail, password, setPassword, error, isSubmitting, handleSubmit }
}
