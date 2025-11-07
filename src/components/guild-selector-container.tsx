import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuildList } from './guild-list.tsx'
import { LoadingState } from './loading-state.tsx'
import { ErrorDisplay } from './error-display.tsx'
import { useGuildStore } from '../stores/index.ts'
import type { Guild } from '../types/index.ts'

/**
 * GuildSelectorContainer - Single responsibility: Handle guild data fetching
 * Uses Zustand store for state management
 * Handles API calls, loading, error states
 * Clear boundary between data and UI
 */
export function GuildSelectorContainer() {
  const { guilds, loading, error, fetchGuilds, retry } = useGuildStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchGuilds()
  }, [fetchGuilds])

  const handleGuildSelect = (guild: Guild) => {
    navigate(`/dashboard/guild/${guild.id}/overview`)
  }

  if (loading) {
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
