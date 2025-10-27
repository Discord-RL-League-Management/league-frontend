import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingState } from '../components/loading-state';

/**
 * AuthCallback - Handle OAuth redirect with HttpOnly cookies
 * Cookie is set by backend, just redirect to dashboard
 * ProtectedRoute will handle the auth check
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = searchParams.get('error');
    
    if (error) {
      // Handle OAuth errors (user denied permission, etc.)
      const description = searchParams.get('description') || 'Authentication failed';
      console.error('OAuth error:', error, description);
      navigate('/login?error=' + encodeURIComponent(error), { replace: true });
      return;
    }
    
    // Cookie is already set by backend
    // Simply redirect to dashboard
    // AuthContext will fetch user automatically on mount
    // ProtectedRoute will show loading state while fetching
    navigate('/dashboard', { replace: true });
  }, [searchParams, navigate]);

  return <LoadingState message="Completing login..." />;
}
