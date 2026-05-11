import { useLogout } from '../hooks/useLogout'

/**
 * Button component that logs the current user out.
 * Calls the logout function from useLogout on click.
 */
export function LogoutButton() {
  const { logout } = useLogout()

  return (
    <button
      type="button"
      onClick={() => { logout() }}
      className="rounded bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400 transition-colors duration-150"
    >
      ログアウト
    </button>
  )
}
