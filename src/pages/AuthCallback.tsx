import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingState } from '../components/ui/loading-state';

/**
 * AuthCallback - Single responsibility: Handle OAuth redirect only
 * Extract token, store it, and redirect to dashboard
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    
    if (error) {
      // Handle OAuth errors (user denied permission, etc.)
      console.error('OAuth error:', error);
      navigate('/login?error=' + encodeURIComponent(error), { replace: true });
      return;
    }
    
    if (token) {
      // Store token and redirect to dashboard
      localStorage.setItem('auth_token', token);
      navigate('/dashboard', { replace: true });
    } else {
      // No token, redirect to login
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return <LoadingState message="Completing login..." />;
}
