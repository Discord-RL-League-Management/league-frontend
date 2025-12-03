import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/index.ts';
import { useTrackersStore } from '../stores/trackersStore.ts';

/**
 * useMyTrackers - React Query-like hook for user's trackers
 * 
 * Best Practice: Components consume data, hook handles fetching automatically
 * - Automatically fetches when user is authenticated and data is stale/missing
 * - Deduplicates requests (store handles this)
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
  
  // Track if we've initiated a fetch to prevent duplicate calls
  const hasInitiatedFetch = useRef(false);

  useEffect(() => {
    // Only fetch if user is authenticated
    if (!user?.id) {
      hasInitiatedFetch.current = false;
      return;
    }

    // Check if data is stale or missing
    const CACHE_TTL = 30000; // 30 seconds
    const isStale = !myTrackersLastFetched || 
                   Date.now() - myTrackersLastFetched > CACHE_TTL;
    const isEmpty = myTrackers.length === 0;

    // Fetch if stale or empty, but only once per mount/user change
    if ((isStale || isEmpty) && !hasInitiatedFetch.current) {
      hasInitiatedFetch.current = true;
      getMyTrackers().finally(() => {
        // Reset flag after fetch completes (success or error)
        // This allows refetch if user changes or component remounts
        hasInitiatedFetch.current = false;
      });
    }
  }, [user?.id, myTrackersLastFetched, myTrackers.length, getMyTrackers]);

  return {
    myTrackers,
    isLoading: loading,
    error,
  };
}

