import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { usePostApiV1AppsByAppIdTodos, usePutApiV1AppsByAppIdTodosByTodoId } from '../../../api/generated'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must not exceed 200 characters'),
})

type FormValues = z.infer<typeof schema>

type Todo = {
  id: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
  appId: string
}

type Props =
  | { mode: 'edit'; todo: Todo; appId: string; onCancel: () => void; onSuccess: () => void }
  | { mode: 'create'; todo?: undefined; appId: string; onCancel: () => void; onSuccess: () => void }

/**
 * Form for creating or editing a todo.
 */
export function TodoForm({ mode, todo, appId, onCancel, onSuccess }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: mode === 'edit' ? todo?.title ?? '' : '' },
  })

  const createMutation = usePostApiV1AppsByAppIdTodos()
  const updateMutation = usePutApiV1AppsByAppIdTodosByTodoId()

  const isLoading = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (values: FormValues) => {
    if (mode === 'edit' && todo) {
      const result = await updateMutation.mutateAsync({ appId, todoId: todo.id, data: { title: values.title } }) as unknown
      const typedResult = result as { status?: number }
      if (typedResult?.status && typedResult.status >= 200 && typedResult.status < 300) {
        onSuccess()
      }
    } else {
      const result = await createMutation.mutateAsync({ appId, data: { title: values.title } }) as unknown
      const typedResult = result as { status?: number }
      if (typedResult?.status && typedResult.status >= 200 && typedResult.status < 300) {
        onSuccess()
      }
    }
  }

  const handleFormSubmit = (values: FormValues) => {
    void onSubmit(values)
  }

  return (
    <form onSubmit={(e) => { handleSubmit(handleFormSubmit)(e).catch(() => {}) }} className="p-3 border rounded bg-gray-50">
      <div className="mb-2">
        <label htmlFor="todo-title" className="block text-sm font-medium mb-1">Title</label>
        <input
          id="todo-title"
          {...register('title')}
          className="w-full px-2 py-1 border rounded text-sm"
          aria-label="Title"
        />
        {errors.title && (
          <p role="alert" className="text-red-500 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      {mode === 'edit' && todo && (
        <div className="mb-2">
          <label htmlFor="todo-status" className="block text-sm font-medium mb-1">Status</label>
          <input
            id="todo-status"
            type="checkbox"
            defaultChecked={todo.completed}
            disabled
            aria-label="Status"
          />
          <span className="ml-2 text-sm text-gray-500">{todo.completed ? 'Completed' : 'Pending'} (read-only)</span>
        </div>
      )}

      {mode === 'create' && (
        <div className="mb-2">
          <label htmlFor="todo-completed" className="block text-sm font-medium mb-1">Completed</label>
          <input
            id="todo-completed"
            type="checkbox"
            defaultChecked={false}
            aria-label="Completed"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
