import { useEffect } from 'react';
import { useAuthStore } from '../stores/index.ts';
import { useGuildStore } from '../stores/guildStore.ts';

/**
 * useGuilds - React Query-like hook for user's guilds
 * 
 * Best Practice: Components consume data, hook handles fetching automatically
 * - Automatically fetches when user is authenticated and data is stale/missing
 * - Deduplicates requests via store's pendingRequest flag
 * - Returns cached data immediately (stale-while-revalidate pattern)
 * 
 * Usage:
 *   const { guilds, isLoading, error } = useGuilds();
 *   // Component just reads data, hook handles fetching
 */
export function useGuilds() {
  const user = useAuthStore((state) => state.user);
  const guilds = useGuildStore((state) => state.guilds);
  const loading = useGuildStore((state) => state.loading);
  const error = useGuildStore((state) => state.error);
  const fetchGuilds = useGuildStore((state) => state.fetchGuilds);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    // Get current state synchronously to check if data is missing
    // Don't depend on guilds.length in dependency array - that causes effect re-runs
    // when data loads, potentially triggering duplicate fetches
    const currentState = useGuildStore.getState();
    const isEmpty = currentState.guilds.length === 0;

    // Check if data is stale or missing
    // Read lastFetched synchronously inside effect, not from dependency array
    // This prevents effect re-runs when lastFetched updates after a successful fetch
    const CACHE_TTL = 300000; // 5 minutes
    const lastFetched = currentState.lastFetched;
    const isStale = !lastFetched || Date.now() - lastFetched > CACHE_TTL;

    // Fetch if stale or empty
    // Store's fetchGuilds handles ALL deduplication - no need to check flags here
    // The store sets pendingRequest synchronously before any async work,
    // so multiple simultaneous calls will be deduplicated automatically

    if (isStale || isEmpty) {
      fetchGuilds().catch(() => {
        // Error is already handled in store state, this just prevents unhandled rejection warning
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  // Note: fetchGuilds is stable from Zustand store
  // Note: We check guilds.length and lastFetched synchronously inside effect, not in dependencies
  // This prevents effect re-runs when data loads or lastFetched updates, which could trigger duplicate fetches

  return {
    guilds,
    isLoading: loading,
    error,
  };
}




