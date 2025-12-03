import { useNavigate } from 'react-router-dom'
import { GuildList } from './guild-list.tsx'
import { LoadingState } from './loading-state.tsx'
import { ErrorDisplay } from './error-display.tsx'
import { useGuilds } from '../hooks/useGuilds.ts'
import { useGuildStore } from '../stores/index.ts'
import type { Guild } from '../types/index.ts'

/**
 * GuildSelectorContainer - Single responsibility: Display guild list
 * Uses useGuilds hook for data fetching - component is read-only consumer
 * Hook handles all fetching logic automatically
 */
export function GuildSelectorContainer() {
  const { guilds, isLoading, error } = useGuilds()
  const retry = useGuildStore((state) => state.retry)
  const navigate = useNavigate()

  const handleGuildSelect = (guild: Guild) => {
    navigate(`/dashboard/guild/${guild.id}/overview`)
  }

  if (isLoading) {
    return <LoadingState message="Loading guilds..." />
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={retry} />
  }

  return (
    <GuildList 
      guilds={guilds}
      selectedGuildId={undefined}
      onGuildSelect={handleGuildSelect}
    />
  )
}
