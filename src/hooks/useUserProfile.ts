import { useEffect, useState, useRef } from 'react';
import { profileApi } from '@/lib/api/profile.js';
import { shouldIgnoreError, createAbortCleanup } from './useAbortableFetch.js';
import { getUserFriendlyErrorMessage } from '@/utils/errorHandling.js';
import type { UserProfile } from '@/types/index.js';

/**
 * useUserProfile Hook
 * 
 * Encapsulates profile API call with loading, error, and abort state management.
 * This hook moves data fetching logic from the Presentation layer to the Application layer,
 * maintaining proper architectural separation.
 * 
 * @returns { profile, loading, error } - Profile data and loading/error states
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const abortController = new AbortController();
    cancelledRef.current = false;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const profileData = await profileApi.getProfile({
          signal: abortController.signal,
        });

        if (!cancelledRef.current && !abortController.signal.aborted) {
          setProfile(profileData);
        }
      } catch (err: unknown) {
        // Ignore abort errors - don't log or set state
        if (shouldIgnoreError(err, abortController.signal, cancelledRef.current)) {
          return;
        }

        const errorMessage = getUserFriendlyErrorMessage(err, 'Unable to load your profile. Please try again');
        if (!cancelledRef.current && !abortController.signal.aborted) {
          setError(errorMessage);
        }
      } finally {
        if (!cancelledRef.current && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return createAbortCleanup(abortController, cancelledRef);
  }, []);

  return { profile, loading, error };
}

