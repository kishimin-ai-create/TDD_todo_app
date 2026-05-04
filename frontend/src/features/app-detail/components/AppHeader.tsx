type App = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

type Props = {
  app: App
  onEdit: () => void
  onDelete: () => void
  onBack?: () => void
}

/**
 * Header component displaying app info and actions.
 */
export function AppHeader({ app, onEdit, onDelete, onBack }: Props) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded text-sm text-blue-500 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">{app.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="mt-2 space-y-0.5 text-sm text-gray-500">
        <p>Created: {app.createdAt.slice(0, 10)}</p>
        <p>Updated: {app.updatedAt.slice(0, 10)}</p>
      </div>
    </div>
  )
}
