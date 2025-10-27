import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { LoadingState } from './loading-state';

/**
 * ProtectedRoute - Single responsibility: Route-level authorization only
 * No API calls or business logic, pure authorization guard
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return <LoadingState message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
