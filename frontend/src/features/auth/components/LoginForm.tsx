import { useState } from 'react'

type LoginFormProps = {
  onSubmit: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  error?: string;
  isLoading?: boolean;
};

/**
 * Login form component.
 */
export function LoginForm({ onSubmit, onSwitchToRegister, error, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(email, password).catch(() => {/* error handled by parent */})
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {isLoading ? 'Logging in…' : 'Log In'}
      </button>

      <p className="text-center text-sm text-gray-500">
        No account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-blue-500 hover:underline"
        >
          Register
        </button>
      </p>
    </form>
  )
}
