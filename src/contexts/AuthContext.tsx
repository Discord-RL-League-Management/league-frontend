import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Single responsibility: Authentication state management only
 * No API calls or UI logic, pure state management
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setError(null);
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load user data';
      setError(errorMessage);
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cookies are sent automatically with withCredentials
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = () => authApi.login();
  
  const logout = () => {
    setUser(null);
    setError(null);
    authApi.logout();
  };

  const retry = () => {
    setLoading(true);
    setError(null);
    fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, retry }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook - Single responsibility: Consuming auth state
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
