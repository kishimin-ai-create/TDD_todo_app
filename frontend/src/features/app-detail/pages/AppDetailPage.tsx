import { useState } from 'react'

import {
  useDeleteApiV1AppsByAppId,
  useGetApiV1AppsByAppId,
  useGetApiV1AppsByAppIdTodos,
} from '../../../api/generated'
import { useNavigation } from '../../../shared/navigation'
import { AppHeader } from '../components/AppHeader'
import { TodoForm } from '../components/TodoForm'
import { TodoList } from '../components/TodoList'

type Props = {
  appId: string
}

/**
 * Page displaying app details and todos.
 */
export function AppDetailPage({ appId }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCreateTodo, setShowCreateTodo] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>()

  const { goToAppList, goToAppEdit } = useNavigation()

  const { data: appData, isLoading: isAppLoading } = useGetApiV1AppsByAppId(appId)
  
  const app = (appData as unknown as { data?: { data?: unknown } } | null)?.data?.data
  
  const { data: todosData, refetch: refetchTodos } = useGetApiV1AppsByAppIdTodos(appId, {
    query: { enabled: !!app },
  })
  const deleteMutation = useDeleteApiV1AppsByAppId()

  const todos = todosData?.data?.data ?? []

  const handleDeleteApp = async () => {
    const response = await deleteMutation.mutateAsync({ appId })
    const typedResponse = response as unknown as { status?: number }
    if (typedResponse?.status && typedResponse.status >= 200 && typedResponse.status < 300) {
      setSuccessMsg('App deleted successfully')
      setIsHidden(true)
      goToAppList()
    }
  }

  const handleEdit = () => {
    setIsHidden(true)
    goToAppEdit(appId)
  }

  if (isHidden) {
    return successMsg ? (
      <div aria-live="polite" className="max-w-2xl mx-auto p-6 text-green-600">
        {successMsg}
      </div>
    ) : null
  }

  if (isAppLoading) {
    return <div role="status" className="text-center py-8">Loading...</div>
  }

  if (!app && appData != null) {
    return (
      <div role="alert" className="max-w-2xl mx-auto p-6 text-red-600">
        App not found
      </div>
    )
  }

  if (!app) {
    return <div role="status" className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <AppHeader
        app={app as { id: string; name: string; createdAt: string; updatedAt: string }}
        onEdit={handleEdit}
        onDelete={() => setShowDeleteConfirm(true)}
        onBack={goToAppList}
      />

      {showDeleteConfirm && (
        <div role="dialog" className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="font-semibold text-yellow-800 mb-1">⚠️ Warning: This action cannot be undone</p>
          <p className="text-sm text-gray-700 mb-3">Deleting this app will permanently remove it and all its associated todos.</p>
          <div className="flex gap-2">
            <button
              onClick={() => { void handleDeleteApp().catch(() => {}) }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={deleteMutation.isPending}
            >
              Confirm
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Todos</h2>
        <button
          onClick={() => setShowCreateTodo(true)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 transition-colors duration-150"
        >
          + Create Todo
        </button>
      </div>

      {showCreateTodo && (
        <div className="mb-4">
          <TodoForm
            mode="create"
            appId={appId}
            onCancel={() => setShowCreateTodo(false)}
            onSuccess={() => { setShowCreateTodo(false); void refetchTodos() }}
          />
        </div>
      )}

      <TodoList todos={todos} appId={appId} onRefresh={() => void refetchTodos()} />
    </div>
  )
}
