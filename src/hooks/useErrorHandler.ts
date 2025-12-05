import { useState, useCallback } from 'react';

interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * useErrorHandler - Single responsibility: Reusable error handling for async operations
 * Consistent error state management with loading states
 */
export function useErrorHandler() {
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setError(null);
      setLoading(true);
      return await asyncFn();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string; code?: string; details?: Record<string, unknown> } }; message?: string };
      const apiError: ApiError = {
        message: errorObj.response?.data?.message || errorObj.message || 'An error occurred',
        code: errorObj.response?.data?.code,
        details: errorObj.response?.data?.details,
      };
      setError(apiError);
      console.error('Async operation failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    loading,
    handleAsync,
    clearError,
  };
}
