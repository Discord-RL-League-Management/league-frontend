import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/index.ts';
import { LoadingState } from './loading-state.tsx';

/**
 * ProtectedRoute - Single responsibility: Route-level authorization only
 * No API calls or business logic, pure authorization guard
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    // Only fetch if we don't have a user and aren't already loading
    if (!user && !loading) {
      fetchUser();
    }
  }, [user, loading, fetchUser]);

  if (loading || !user) {
    return <LoadingState message="Loading..." />;
  }

  return <>{children}</>;
}
