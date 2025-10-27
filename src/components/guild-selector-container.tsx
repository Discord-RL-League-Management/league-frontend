import { useEffect } from 'react'
import { GuildList } from './guild-list'
import { LoadingState } from './loading-state'
import { ErrorDisplay } from './error-display'
import { useGuildStore } from '../stores'
import type { Guild } from '../types'

interface GuildSelectorContainerProps {
  onGuildSelect: (guild: Guild) => void
  selectedGuildId?: string
}

/**
 * GuildSelectorContainer - Single responsibility: Handle guild data fetching
 * Uses Zustand store for state management
 * Handles API calls, loading, error states
 * Clear boundary between data and UI
 */
export function GuildSelectorContainer({ 
  onGuildSelect, 
  selectedGuildId 
}: GuildSelectorContainerProps) {
  const { guilds, loading, error, fetchGuilds, retry } = useGuildStore()

  useEffect(() => {
    fetchGuilds()
  }, [fetchGuilds])

  if (loading) {
    return <LoadingState message="Loading guilds..." />
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={retry} />
  }

  return (
    <GuildList 
      guilds={guilds}
      selectedGuildId={selectedGuildId}
      onGuildSelect={onGuildSelect}
    />
  )
}
