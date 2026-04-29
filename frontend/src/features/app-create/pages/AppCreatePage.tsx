import { useState } from 'react'

import { usePostApiV1Apps } from '../../../api/generated'
import { useNavigation } from '../../../shared/navigation'
import { AppForm } from '../components/AppForm'

/**
 * Page for creating a new app.
 */
export function AppCreatePage() {
  const [serverError, setServerError] = useState<string>()
  const [isHidden, setIsHidden] = useState(false)
  const { goToAppList } = useNavigation()
  const mutation = usePostApiV1Apps()

  if (isHidden) return null

  const handleSubmit = async (values: { name: string }) => {
    setServerError(undefined)
    try {
      const result = await mutation.mutateAsync({ data: { name: values.name } }) as unknown
      const typedResult = result as { status?: number }
      if (typedResult?.status === 201) {
        setIsHidden(true)
        goToAppList()
      } else if (typedResult?.status === 409) {
        setServerError('App name already exists')
      } else if (typedResult?.status === 422) {
        setServerError('Validation error: please check your input')
      } else {
        setServerError('Server error. Please try again later.')
      }
    } catch {
      setServerError('An error occurred. Please try again.')
    }
  }

  const handleCancel = () => {
    setIsHidden(true)
    goToAppList()
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New App</h1>
      <AppForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={mutation.isPending}
        submitLabel="Create"
        serverError={serverError}
      />
    </div>
  )
}
