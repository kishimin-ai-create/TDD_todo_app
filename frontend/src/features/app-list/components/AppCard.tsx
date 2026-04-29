import type { GetApiV1Apps200DataItem } from '../../../api/generated/models'
import { useNavigation } from '../../../shared/navigation'

type Props = {
  app: GetApiV1Apps200DataItem
  onView?: (appId: string) => void
}

/**
 * Card component displaying app summary and view button.
 */
export function AppCard({ app, onView }: Props) {
  const { goToAppDetail } = useNavigation()

  const handleView = () => {
    if (onView) {
      onView(app.id)
    } else {
      goToAppDetail(app.id)
    }
  }

  const formattedDate = new Date(app.createdAt).toISOString().split('T')[0]

  return (
    <div className="p-4 bg-white border border-gray-200 rounded shadow hover:shadow-lg">
      <h3 className="text-lg font-semibold">{app.name}</h3>
      <p className="text-sm text-gray-500">Created: {formattedDate}</p>
      <button
        onClick={handleView}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
      >
        View
      </button>
    </div>
  )
}
