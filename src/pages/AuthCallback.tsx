import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingState } from '../components/loading-state.tsx';

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
    
    // Check if there's a guild context to redirect to
    const guildId = searchParams.get('guild');
    
    if (guildId) {
      // Redirect to specific guild's settings page
      navigate(`/dashboard/guild/${guildId}/settings`, { replace: true });
    } else {
      // No guild context, go to general dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate]);

  return <LoadingState message="Completing login..." />;
}
