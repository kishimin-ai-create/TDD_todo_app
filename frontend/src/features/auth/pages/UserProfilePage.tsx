import { useAtom } from 'jotai'
import { useState } from 'react'

import { authAtom } from '../../../shared/auth'
import { useNavigation } from '../../../shared/navigation'

/**
 * User profile edit page that allows the user to update their email and password.
 */
export function UserProfilePage() {
  const [auth, setAuth] = useAtom(authAtom)
  const { goToAppList } = useNavigation()

  const [email, setEmail] = useState(auth?.user.email ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const body: { email: string; newPassword?: string; currentPassword?: string } = { email }
      if (newPassword) {
        body.newPassword = newPassword
        body.currentPassword = currentPassword
      }

      const res = await fetch(`/api/v1/users/${auth?.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json() as {
        success: boolean
        data?: { id: string; email: string }
        error?: { code: string; message: string }
      }

      if (json.success && json.data) {
        setAuth({
          token: auth!.token,
          user: { id: auth!.user.id, email: json.data.email },
        })
        setSuccessMessage('保存しました')
      } else {
        setError(json.error?.message ?? '保存に失敗しました')
      }
    } catch {
      setError('保存に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <button
        type="button"
        onClick={goToAppList}
        className="mb-4 px-4 py-2 border rounded"
      >
        ← 戻る
      </button>
      <h1 className="text-2xl font-bold mb-6">プロフィール編集</h1>
      <form onSubmit={(e) => { handleSubmit(e).catch(() => { /* handled inside */ }) }}>
        <div className="mb-4">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="block w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="block w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        {newPassword && (
          <div className="mb-4">
            <label htmlFor="currentPassword">現在のパスワード</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="block w-full border rounded px-3 py-2 mt-1"
            />
          </div>
        )}
        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
            {successMessage}
          </div>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full disabled:opacity-50"
        >
          保存
        </button>
      </form>
    </div>
  )
}
