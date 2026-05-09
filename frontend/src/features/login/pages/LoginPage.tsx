import { zodResolver } from '@hookform/resolvers/zod'
import { useSetAtom } from 'jotai'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { isAuthenticatedAtom } from '../../../shared/auth'

const schema = z.object({
  email: z.string().min(1, 'メールアドレスは必須です').email('メールアドレスの形式が正しくありません'),
  password: z.string().min(1, 'パスワードは必須です'),
})

type FormValues = z.infer<typeof schema>

/**
 * Login page component that gates access to the application.
 */
export function LoginPage() {
  const setIsAuthenticated = useSetAtom(isAuthenticatedAtom)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const handleLogin = () => {
    // NOTE: This is a temporary mock login that accepts any valid-format credentials.
    // Replace with a real API call (e.g., POST /api/v1/auth/login) once the backend
    // authentication endpoint is implemented.
    setIsAuthenticated(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">ログイン</h1>
        <form
          noValidate
          onSubmit={(e) => {
            handleSubmit(handleLogin)(e).catch(() => {})
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="example@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="メールアドレス"
            />
            {errors.email && (
              <p role="alert" className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              placeholder="パスワードを入力..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="パスワード"
            />
            {errors.password && (
              <p role="alert" className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 transition-colors duration-150"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  )
}
