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
  const [retryCount, setRetryCount] = useState(0)

  const MAX_RETRIES = 3

  const fetchGuilds = () => {
    setLoading(true)
    setError(null)
    
    guildApi.getMyGuilds()
      .then(setGuilds)
      .catch((err) => {
        const errorMessage = err.response?.data?.message || 'Failed to load guilds'
        setError(errorMessage)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchGuilds()
  }, [])

  const handleRetry = () => {
    if (retryCount >= MAX_RETRIES) {
      setError('Max retries reached. Please refresh the page.')
      return
    }
    
    setRetryCount(prev => prev + 1)
    fetchGuilds()
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
