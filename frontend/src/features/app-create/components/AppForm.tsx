import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'App name is required').max(100, 'App name must not exceed 100 characters'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  defaultValue?: string
  onSubmit: (values: FormValues) => Promise<void>
  onCancel: () => void
  isLoading: boolean
  submitLabel?: string
  serverError?: string
}

/**
 * Form component for creating or editing an app.
 */
export function AppForm({ defaultValue, onSubmit, onCancel, isLoading, submitLabel = 'Create', serverError }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultValue ?? '' },
  })

  const handleFormSubmit = (values: FormValues) => {
    void onSubmit(values).catch(() => {})
  }

  return (
    <form onSubmit={(e) => { handleSubmit(handleFormSubmit)(e).catch(() => {}) }} className="space-y-4">
      <div>
        <label htmlFor="app-name" className="block text-sm font-medium mb-1">App Name *</label>
        <input
          id="app-name"
          {...register('name')}
          placeholder="Enter app name..."
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="App Name"
        />
        {errors.name && (
          <p role="alert" className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
        {serverError && (
          <p role="alert" className="text-red-500 text-sm mt-1">{serverError}</p>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400 transition-colors duration-150"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 transition-colors duration-150"
        >
          {isLoading ? 'Loading...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
