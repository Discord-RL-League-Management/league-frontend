/**
 * Error Handling Utilities
 * 
 * Shared utilities for error handling across the application.
 * Extracted from component-level implementations to promote reuse.
 */

/**
 * Helper function to check if an error is an abort/cancel error
 * 
 * @param err - Error to check
 * @param signal - Optional AbortSignal to check
 * @returns true if error is an abort error
 */
export function isAbortError(err: unknown, signal?: AbortSignal): boolean {
  if (err === null || err === undefined) {
    return false;
  }
  const error = err as { name?: string; message?: string; code?: string };
  return (
    error.name === 'AbortError' ||
    error.message === 'canceled' ||
    error.code === 'ERR_CANCELED' ||
    signal?.aborted === true
  );
}

/**
 * Helper function to log errors consistently (only for non-abort errors)
 * 
 * @param context - Context string for error logging
 * @param err - Error to log
 */
export function logError(context: string, err: unknown): void {
  console.error(`${context}:`, err);
  
  if (err !== null && err !== undefined && typeof err === 'object') {
    const error = err as { message?: string; status?: number; response?: { data?: unknown } };
    console.error(`${context} - message:`, error.message);
    console.error(`${context} - status:`, error.status);
    console.error(`${context} - response:`, error.response?.data);
  }
  
  try {
    if (err !== null && err !== undefined && typeof err === 'object') {
      console.error(`${context} - full error:`, JSON.stringify(err, Object.getOwnPropertyNames(err as object)));
    } else {
      console.error(`${context} - full error:`, err);
    }
  } catch {
    console.error(`${context} - full error:`, err);
  }
}

/**
 * Helper function to check if an operation should be ignored due to cancellation
 * 
 * @param err - Error to check
 * @param signal - AbortSignal to check
 * @param cancelled - Cancellation flag
 * @returns true if error should be ignored
 */
export function shouldIgnoreError(
  err: unknown,
  signal: AbortSignal,
  cancelled: boolean
): boolean {
  return cancelled || signal.aborted || isAbortError(err, signal);
}

/**
 * Extracts a user-friendly error message from an error object
 * 
 * @param err - Error object
 * @param defaultMessage - Default message if error cannot be parsed
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(err: unknown, defaultMessage: string): string {
  if (err === null || err === undefined) {
    return defaultMessage;
  }

  const httpError = err as { response?: { data?: { message?: string }; status?: number }; status?: number };
  if (httpError.response?.data?.message) {
    return httpError.response.data.message;
  }

  const status = httpError.response?.status || httpError.status;
  if (status) {
    switch (status) {
      case 401:
        return 'Please log in to view this information';
      case 403:
        return 'You do not have permission to access this resource';
      case 404:
        return 'The requested information was not found';
      case 500:
      case 502:
      case 503:
        return 'The server is temporarily unavailable. Please try again later';
      case 504:
        return 'The request timed out. Please try again';
      default:
        if (status >= 400 && status < 500) {
          return 'There was a problem with your request. Please try again';
        }
        if (status >= 500) {
          return 'A server error occurred. Please try again later';
        }
    }
  }

  if (err instanceof Error && err.message) {
    // Filter out technical error messages that aren't user-friendly
    const message = err.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection';
    }
    if (message.includes('timeout')) {
      return 'The request took too long. Please try again';
    }
    return err.message;
  }

  return defaultMessage;
}

/**
 * Creates a cleanup function for abortable operations
 * 
 * @param abortController - AbortController instance
 * @param cancelledRef - Reference to cancellation flag
 * @returns Cleanup function
 */
export function createAbortCleanup(
  abortController: AbortController,
  cancelledRef: { current: boolean }
): () => void {
  return () => {
    cancelledRef.current = true;
    abortController.abort();
  };
}

