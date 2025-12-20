import { useEffect, useState, useRef } from 'react';
import { profileApi } from '@/lib/api/profile.js';
import { shouldIgnoreError, createAbortCleanup } from './useAbortableFetch.js';
import { getUserFriendlyErrorMessage } from '@/utils/errorHandling.js';
import type { UserProfile } from '@/types/index.js';

// Module-level cache to prevent duplicate fetches across component instances
let cachedProfile: UserProfile | null = null;
let profileCacheTimestamp: number | null = null;
let profileFetchPromise: Promise<UserProfile> | null = null;
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Reset module-level cache (for testing purposes)
 * @internal
 */
export function __resetCache() {
  cachedProfile = null;
  profileCacheTimestamp = null;
  profileFetchPromise = null;
}

/**
 * useUserProfile Hook
 * 
 * Encapsulates profile API call with loading, error, and abort state management.
 * Includes caching to prevent duplicate fetches across component instances.
 * 
 * @returns { profile, loading, error } - Profile data and loading/error states
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    if (cachedProfile && profileCacheTimestamp && (now - profileCacheTimestamp < PROFILE_CACHE_TTL)) {
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }

    if (profileFetchPromise) {
      profileFetchPromise
        .then((data) => {
          if (!cancelledRef.current) {
            setProfile(data);
          }
          setLoading(false);
        })
        .catch(() => {
          // Silently ignore - errors handled in main fetch flow
          setLoading(false);
        });
      return;
    }

    const abortController = new AbortController();
    cancelledRef.current = false;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const fetchPromise = profileApi.getProfile({
          signal: abortController.signal,
        });
        profileFetchPromise = fetchPromise;

        const profileData = await fetchPromise;

        cachedProfile = profileData;
        profileCacheTimestamp = Date.now();
        profileFetchPromise = null;

        if (!cancelledRef.current && !abortController.signal.aborted) {
          setProfile(profileData);
        }
      } catch (err: unknown) {
        profileFetchPromise = null;
        // Suppress abort errors to prevent unnecessary state updates and console noise
        if (shouldIgnoreError(err, abortController.signal, cancelledRef.current)) {
          return;
        }

        const errorMessage = getUserFriendlyErrorMessage(err, 'Unable to load your profile. Please try again');
        if (!cancelledRef.current && !abortController.signal.aborted) {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    return createAbortCleanup(abortController, cancelledRef);
  }, []);

  return { profile, loading, error };
}

