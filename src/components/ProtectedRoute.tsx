import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/index.ts';
import { LoadingState } from './loading-state.tsx';

/**
 * ProtectedRoute - Single responsibility: Route-level authorization only
 * No API calls or business logic, pure authorization guard
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  // Track fetch attempts to prevent infinite loops
  const fetchAttemptRef = React.useRef(0);
  const lastFetchTimeRef = React.useRef<number | null>(null);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds

  useEffect(() => {
    // Only fetch if we don't have a user and aren't already loading
    if (!user && !loading) {
      const now = Date.now();
      
      // Prevent infinite loops: check if we've tried too many times recently
      if (fetchAttemptRef.current >= MAX_RETRIES) {
        const timeSinceLastFetch = lastFetchTimeRef.current 
          ? now - lastFetchTimeRef.current 
          : Infinity;
        
        if (timeSinceLastFetch < RETRY_DELAY) {
          console.warn('Max fetch attempts reached, stopping to prevent infinite loop');
          return;
        }
        
        if (timeSinceLastFetch >= RETRY_DELAY) {
          fetchAttemptRef.current = 0;
        }
      }

      fetchAttemptRef.current += 1;
      lastFetchTimeRef.current = now;
      
      fetchUser().catch((err) => {
        // Error is handled in store, but we need to catch to prevent unhandled rejection
        console.error('Error fetching user in ProtectedRoute:', err);
      });
    } else if (user) {
      fetchAttemptRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  if (!user && !loading && fetchAttemptRef.current >= MAX_RETRIES && error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => {
              fetchAttemptRef.current = 0;
              fetchUser();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return <LoadingState message="Loading..." />;
  }

  return <>{children}</>;
}
