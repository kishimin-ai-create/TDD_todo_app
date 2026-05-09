import { zodResolver } from '@hookform/resolvers/zod'
import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { login } from '../../../api/auth'
import { authAtom } from '../../../shared/auth'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  onGoToSignup: () => void
}

/**
 * Page for user login.
 */
export function LoginPage({ onGoToSignup }: Props) {
  const setAuth = useSetAtom(authAtom)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const handleFormSubmit = (values: FormValues) => {
    setServerError(null)
    setIsLoading(true)
    login(values.email, values.password)
      .then(auth => {
        setAuth(auth)
      })
      .catch((err: unknown) => {
        setServerError(
          err instanceof Error ? err.message : 'Login failed. Please try again.',
        )
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Log In</h1>
        <form
          onSubmit={e => {
            handleSubmit(handleFormSubmit)(e).catch(() => {})
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Email"
            />
            {errors.email && (
              <p role="alert" className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Password"
            />
            {errors.password && (
              <p role="alert" className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="text-red-500 text-sm">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 transition-colors duration-150"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onGoToSignup}
            className="text-blue-500 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}
