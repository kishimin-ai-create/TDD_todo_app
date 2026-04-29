import { useState } from 'react'
import {
  useDeleteApiV1AppsByAppIdTodosByTodoId,
  usePutApiV1AppsByAppIdTodosByTodoId,
} from '../../../api/generated'
import { TodoForm } from './TodoForm'

type Todo = {
  id: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
  appId: string
}

type Props = {
  todo: Todo
  appId: string
  onRefresh: () => void
}

/**
 * Renders a single todo item with edit and delete actions.
 */
export function TodoItem({ todo, appId, onRefresh }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>()

  const deleteMutation = useDeleteApiV1AppsByAppIdTodosByTodoId()
  const toggleMutation = usePutApiV1AppsByAppIdTodosByTodoId()

  const handleDelete = async () => {
    const result = await deleteMutation.mutateAsync({ appId, todoId: todo.id }) as unknown
    const typedResult = result as { status?: number }
    if (typedResult?.status && typedResult.status >= 200 && typedResult.status < 300) {
      setSuccessMsg('Todo deleted successfully')
      setShowConfirm(false)
      onRefresh()
    }
  }

  const handleCheckboxChange = async () => {
    await toggleMutation.mutateAsync({
      appId,
      todoId: todo.id,
      data: { completed: !todo.completed },
    })
    onRefresh()
  }

  if (isEditing) {
    return (
      <TodoForm
        mode="edit"
        todo={todo}
        appId={appId}
        onCancel={() => setIsEditing(false)}
        onSuccess={() => { setIsEditing(false); onRefresh() }}
      />
    )
  }

  return (
    <div className="p-3 border rounded bg-white">
      {successMsg && (
        <p aria-live="polite" className="text-green-600 text-sm mb-2">{successMsg}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => { void handleCheckboxChange().catch(() => {}) }}
          className="cursor-pointer"
        />
        <span className={todo.completed ? 'line-through text-gray-500' : ''}>{todo.title}</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
          >
            Edit
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      {showConfirm && (
        <div role="dialog" className="mt-2 p-3 bg-yellow-50 border border-yellow-300 rounded">
          <p className="text-sm mb-2">Delete this todo?</p>
          <div className="flex gap-2">
            <button
              onClick={() => { void handleDelete().catch(() => {}) }}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded"
              disabled={deleteMutation.isPending}
            >
              Confirm
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1 text-sm bg-gray-200 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
