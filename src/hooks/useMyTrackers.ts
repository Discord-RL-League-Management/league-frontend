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

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    // Store handles caching, deduplication, and TTL internally to prevent race conditions
    getMyTrackers().catch(() => {
      // Suppress unhandled rejection - errors are handled in store state
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  // Excluding getMyTrackers from deps prevents re-runs when data loads, avoiding duplicate fetches

  return {
    myTrackers,
    isLoading: loading,
    error,
  };
}

