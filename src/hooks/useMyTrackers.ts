import { useEffect } from 'react';
import { useAuthStore } from '../stores/index.ts';
import { useTrackersStore } from '../stores/trackersStore.ts';

/**
 * useMyTrackers - React Query-like hook for user's trackers
 * 
 * Best Practice: Components consume data, hook handles fetching automatically
 * - Automatically fetches when user is authenticated and data is stale/missing
 * - Deduplicates requests via store's myTrackersRequestInFlight flag
 * - Returns cached data immediately (stale-while-revalidate pattern)
 * 
 * Usage:
 *   const { myTrackers, isLoading, error } = useMyTrackers();
 *   // Component just reads data, hook handles fetching
 */
export function useMyTrackers() {
  const user = useAuthStore((state) => state.user);
  const myTrackers = useTrackersStore((state) => state.myTrackers);
  const loading = useTrackersStore((state) => state.loading);
  const error = useTrackersStore((state) => state.error);
  const getMyTrackers = useTrackersStore((state) => state.getMyTrackers);
  const myTrackersLastFetched = useTrackersStore((state) => state.myTrackersLastFetched);

  useEffect(() => {
    // Only fetch if user is authenticated
    if (!user?.id) {
      return;
    }

    // Get current state synchronously to check if data is missing
    // Don't depend on myTrackers.length in dependency array - that causes effect re-runs
    // when data loads, potentially triggering duplicate fetches
    const currentState = useTrackersStore.getState();
    const isEmpty = currentState.myTrackers.length === 0;

    // Check if data is stale or missing
    const CACHE_TTL = 30000; // 30 seconds
    const isStale = !myTrackersLastFetched || 
                   Date.now() - myTrackersLastFetched > CACHE_TTL;

    // Fetch if stale or empty
    // Store's getMyTrackers handles ALL deduplication - no need to check flags here
    // The store sets myTrackersRequestInFlight synchronously before any async work,
    // so multiple simultaneous calls will be deduplicated automatically
    if (isStale || isEmpty) {
      getMyTrackers().catch(() => {
        // Error is already handled in store state, this just prevents unhandled rejection warning
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, myTrackersLastFetched]);
  // Note: getMyTrackers is stable from Zustand store
  // Note: We check myTrackers.length synchronously inside effect, not in dependencies
  // This prevents effect re-runs when data loads, which could trigger duplicate fetches

  return {
    myTrackers,
    isLoading: loading,
    error,
  };
}

