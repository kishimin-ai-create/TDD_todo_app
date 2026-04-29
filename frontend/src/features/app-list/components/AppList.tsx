import type { GetApiV1Apps200DataItem } from '../../../api/generated/models'
import { AppCard } from './AppCard'

type Props = {
  apps: GetApiV1Apps200DataItem[]
}

/**
 * Renders a list of app cards.
 */
export function AppList({ apps }: Props) {
  if (apps.length === 0) {
    return <p className="text-gray-500 text-center py-8">No apps yet. Create your first app!</p>
  }

  return (
    <div className="space-y-4">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  )
}
