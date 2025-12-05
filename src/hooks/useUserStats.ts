import { useEffect, useState, useRef } from 'react';
import { profileApi } from '@/lib/api/profile.js';
import { shouldIgnoreError, createAbortCleanup } from './useAbortableFetch.js';
import { getUserFriendlyErrorMessage } from '@/utils/errorHandling.js';
import type { UserStats } from '@/types/index.js';

/**
 * useUserStats Hook
 * 
 * Encapsulates stats API call with loading, error, and abort state management.
 * This hook moves data fetching logic from the Presentation layer to the Application layer,
 * maintaining proper architectural separation.
 * 
 * @returns { stats, loading, error } - Stats data and loading/error states
 */
export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const abortController = new AbortController();
    cancelledRef.current = false;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const statsData = await profileApi.getStats({
          signal: abortController.signal,
        });

        if (!cancelledRef.current && !abortController.signal.aborted) {
          setStats(statsData);
        }
      } catch (err: unknown) {
        // Ignore abort errors - don't log or set state
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

