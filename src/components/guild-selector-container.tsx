import { useState, useEffect } from 'react'
import { GuildList } from './guild-list'
import { LoadingState } from './ui/loading-state'
import { ErrorDisplay } from './ui/error-display'
import { guildApi, type Guild } from '../lib/api'

interface GuildSelectorContainerProps {
  onGuildSelect: (guild: Guild) => void
  selectedGuildId?: string
}

/**
 * GuildSelectorContainer - Single responsibility: Handle guild data fetching
 * Handles API calls, loading, error states
 * Clear boundary between data and UI
 */
export function GuildSelectorContainer({ 
  onGuildSelect, 
  selectedGuildId 
}: GuildSelectorContainerProps) {
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    guildApi.getMyGuilds()
      .then(setGuilds)
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load guilds')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    guildApi.getMyGuilds()
      .then(setGuilds)
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load guilds')
      })
      .finally(() => setLoading(false))
  }

  if (loading) {
    return <LoadingState message="Loading guilds..." />
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />
  }

  return (
    <GuildList 
      guilds={guilds}
      selectedGuildId={selectedGuildId}
      onGuildSelect={onGuildSelect}
    />
  )
}
