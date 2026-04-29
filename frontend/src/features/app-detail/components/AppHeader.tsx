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
    <div className="flex justify-between items-center mb-6">
      <div>
        <button
          onClick={onBack}
          className="mb-2 text-sm text-blue-500 hover:underline"
        >
          Back
        </button>
        <h1 className="text-2xl font-bold">{app.name}</h1>
        <p className="text-sm text-gray-500">
          Created: {app.createdAt.slice(0, 10)}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
