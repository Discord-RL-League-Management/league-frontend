import { useEffect, useState, useRef } from 'react';
import { profileApi } from '@/lib/api/profile.js';
import { shouldIgnoreError, createAbortCleanup } from './useAbortableFetch.js';
import { getUserFriendlyErrorMessage } from '@/utils/errorHandling.js';
import type { UserStats } from '@/types/index.js';

// Module-level cache to prevent duplicate fetches across component instances
let cachedStats: UserStats | null = null;
let statsCacheTimestamp: number | null = null;
let statsFetchPromise: Promise<UserStats> | null = null;
const STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * useUserStats Hook
 * 
 * Encapsulates stats API call with loading, error, and abort state management.
 * Includes caching to prevent duplicate fetches across component instances.
 * 
 * @returns { stats, loading, error } - Stats data and loading/error states
 */
export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(cachedStats);
  const [loading, setLoading] = useState(!cachedStats);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    if (cachedStats && statsCacheTimestamp && (now - statsCacheTimestamp < STATS_CACHE_TTL)) {
      setStats(cachedStats);
      setLoading(false);
      return;
    }

    if (statsFetchPromise) {
      statsFetchPromise
        .then((data) => {
          if (!cancelledRef.current) {
            setStats(data);
            setLoading(false);
          }
        })
        .catch(() => {
          // Silently ignore - errors handled in main fetch flow
        });
      return;
    }

    const abortController = new AbortController();
    cancelledRef.current = false;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const fetchPromise = profileApi.getStats({
          signal: abortController.signal,
        });
        statsFetchPromise = fetchPromise;

        const statsData = await fetchPromise;

        cachedStats = statsData;
        statsCacheTimestamp = Date.now();
        statsFetchPromise = null;

        if (!cancelledRef.current && !abortController.signal.aborted) {
          setStats(statsData);
        }
      } catch (err: unknown) {
        statsFetchPromise = null;
        // Suppress abort errors to prevent unnecessary state updates and console noise
        if (shouldIgnoreError(err, abortController.signal, cancelledRef.current)) {
          return;
        }

        const errorMessage = getUserFriendlyErrorMessage(err, 'Unable to load your statistics. Please try again');
        if (!cancelledRef.current && !abortController.signal.aborted) {
          setError(errorMessage);
        }
      } finally {
        if (!cancelledRef.current && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return createAbortCleanup(abortController, cancelledRef);
  }, []);

  return { stats, loading, error };
}

