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

    // Don't fetch if there's already a request in flight (store handles deduplication)
    // Check this synchronously to prevent race conditions
    const currentState = useTrackersStore.getState();
    if (currentState.myTrackersRequestInFlight) {
      return;
    }

    // Check if data is stale or missing
    const CACHE_TTL = 30000; // 30 seconds
    const isStale = !myTrackersLastFetched || 
                   Date.now() - myTrackersLastFetched > CACHE_TTL;
    const isEmpty = myTrackers.length === 0;

    // Fetch if stale or empty
    // Store's getMyTrackers will handle deduplication if multiple components call simultaneously
    if (isStale || isEmpty) {
      getMyTrackers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, myTrackersLastFetched, myTrackers.length]);
  // Note: getMyTrackers is stable from Zustand, but we check myTrackersRequestInFlight
  // synchronously inside the effect to avoid dependency on it (which would cause re-runs)

  return {
    myTrackers,
    isLoading: loading,
    error,
  };
}

