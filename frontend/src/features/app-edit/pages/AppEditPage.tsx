import { useState } from 'react'

import { useGetApiV1AppsByAppId, usePutApiV1AppsByAppId } from '../../../api/generated'
import { useNavigation } from '../../../shared/navigation'
import { AppForm } from '../components/AppForm'

type Props = {
  appId: string
}

/**
 * Page for editing an app.
 */
export function AppEditPage({ appId }: Props) {
  const [serverError, setServerError] = useState<string>()
  const [isHidden, setIsHidden] = useState(false)
  const { goToAppDetail } = useNavigation()
  const { data, isLoading } = useGetApiV1AppsByAppId(appId)
  const mutation = usePutApiV1AppsByAppId()

  const app = (data as unknown as { data?: { data?: unknown } } | null)?.data?.data

  if (isHidden) return null

  if (isLoading) {
    return <div role="status">Loading...</div>
  }

  if (!app && !isLoading) {
    return <div role="alert" className="p-4 bg-red-50 border border-red-300 rounded text-red-700">App not found. Please check the app ID.</div>
  }

  const handleSubmit = async (values: { name: string }) => {
    setServerError(undefined)
    try {
      const result = await mutation.mutateAsync({ appId, data: { name: values.name } }) as unknown
      const typedResult = result as { status?: number }
      if (typedResult?.status === 200) {
        setIsHidden(true)
        goToAppDetail(appId)
      } else if (typedResult?.status === 409) {
        setServerError('App name already exists')
      } else if (typedResult?.status === 422) {
        setServerError('Validation error: please check your input')
      }
    } catch {
      setServerError('An error occurred. Please try again.')
    }
  }

  const handleCancel = () => {
    setIsHidden(true)
    goToAppDetail(appId)
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit App</h1>
      <AppForm
        defaultValue={(app as { name: string }).name}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={mutation.isPending}
        submitLabel="Update"
        serverError={serverError}
      />
    </div>
  )
}
