/**
 * Black Box Tests for Error Handling Utilities
 * 
 * These tests strictly adhere to the Black Box Axiom:
 * - Verify only public contract (inputs, outputs, observable side effects)
 * - No implementation coupling
 * - State verification preferred
 * - Cyclomatic complexity v(G) ≤ 7 per test
 */

import {
  isAbortError,
  logError,
  shouldIgnoreError,
  getUserFriendlyErrorMessage,
  createAbortCleanup,
} from '../errorHandling.js';

describe('isAbortError', () => {
  describe('returns false for null/undefined errors', () => {
    test('returns false when error is null', () => {
      expect(isAbortError(null)).toBe(false);
    });

    test('returns false when error is undefined', () => {
      expect(isAbortError(undefined)).toBe(false);
    });

    test('returns false when error is null with signal', () => {
      const signal = new AbortController().signal;
      expect(isAbortError(null, signal)).toBe(false);
    });
  });

  describe('returns true for abort error indicators', () => {
    test('returns true for error with name AbortError', () => {
      const error = { name: 'AbortError' };
      expect(isAbortError(error)).toBe(true);
    });

    test('returns true for error with message canceled', () => {
      const error = { message: 'canceled' };
      expect(isAbortError(error)).toBe(true);
    });

    test('returns true for error with code ERR_CANCELED', () => {
      const error = { code: 'ERR_CANCELED' };
      expect(isAbortError(error)).toBe(true);
    });

    test('returns true when signal is aborted', () => {
      const controller = new AbortController();
      controller.abort();
      const error = new Error('Some error');
      expect(isAbortError(error, controller.signal)).toBe(true);
    });
  });

  describe('returns false for non-abort errors', () => {
    test.each([
      [new Error('Generic error'), 'generic Error instance'],
      [{ name: 'SomeOtherError' }, 'error with different name'],
      [{ message: 'something went wrong' }, 'error with different message'],
      [{ code: 'SOME_OTHER_CODE' }, 'error with different code'],
      ['string error', 'string'],
      [42, 'number'],
      [{}, 'empty object'],
    ])('returns false for %s', (err, _description) => {
      expect(isAbortError(err)).toBe(false);
    });
  });

  describe('signal handling', () => {
    test('returns false when signal provided but not aborted', () => {
      const signal = new AbortController().signal;
      const error = new Error('Some error');
      expect(isAbortError(error, signal)).toBe(false);
    });

    test('returns true when signal aborted even if error is not abort error', () => {
      const controller = new AbortController();
      controller.abort();
      const error = { message: 'Some other error' };
      expect(isAbortError(error, controller.signal)).toBe(true);
    });
  });

  describe('multiple abort indicators', () => {
    test('returns true when error has abort name and signal is aborted', () => {
      const controller = new AbortController();
      controller.abort();
      const error = { name: 'AbortError' };
      expect(isAbortError(error, controller.signal)).toBe(true);
    });

    test('returns true when error has multiple abort indicators', () => {
      const error = {
        name: 'AbortError',
        message: 'canceled',
        code: 'ERR_CANCELED',
      };
      expect(isAbortError(error)).toBe(true);
    });
  });
});

describe('logError', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('calls console.error with context prefix', () => {
    test('calls console.error with context and error', () => {
      const context = 'TestContext';
      const error = new Error('Test error');

      logError(context, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`${context}:`, error);
    });

    test('calls console.error for non-object errors', () => {
      const context = 'TestContext';
      const error = 'String error';

      logError(context, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`${context}:`, error);
    });
  });

  describe('handles error object properties', () => {
    test('logs message property when present', () => {
      const context = 'TestContext';
      const error = { message: 'Error message' };

      logError(context, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`${context} - message:`, 'Error message');
    });

    test('logs status property when present', () => {
      const context = 'TestContext';
      const error = { status: 404 };

      logError(context, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`${context} - status:`, 404);
    });

    test('logs response.data when present', () => {
      const context = 'TestContext';
      const error = { response: { data: { detail: 'Not found' } } };

      logError(context, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`${context} - response:`, { detail: 'Not found' });
    });
  });

  describe('handles different error types', () => {
    test('handles null errors', () => {
      const context = 'TestContext';

      logError(context, null);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('handles undefined errors', () => {
      const context = 'TestContext';

      logError(context, undefined);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('handles string errors', () => {
      const context = 'TestContext';
      const error = 'String error';

      logError(context, error);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('handles number errors', () => {
      const context = 'TestContext';
      const error = 500;

      logError(context, error);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('handles circular reference errors gracefully', () => {
    test('does not throw when JSON.stringify fails', () => {
      const context = 'TestContext';
      const error: Record<string, unknown> = { circular: null };
      error.circular = error; // Create circular reference

      expect(() => logError(context, error)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('does not throw exceptions', () => {
    test('does not throw for any error type', () => {
      const context = 'TestContext';

      expect(() => logError(context, null)).not.toThrow();
      expect(() => logError(context, undefined)).not.toThrow();
      expect(() => logError(context, 'string')).not.toThrow();
      expect(() => logError(context, 123)).not.toThrow();
      expect(() => logError(context, {})).not.toThrow();
      expect(() => logError(context, new Error('error'))).not.toThrow();
    });
  });
});

describe('shouldIgnoreError', () => {
  describe('returns true when cancelled flag is true', () => {
    test('returns true when cancelled is true regardless of error', () => {
      const signal = new AbortController().signal;
      const error = new Error('Some error');

      expect(shouldIgnoreError(error, signal, true)).toBe(true);
    });

    test('returns true when cancelled is true even if signal not aborted', () => {
      const signal = new AbortController().signal;
      const error = new Error('Some error');

      expect(shouldIgnoreError(error, signal, true)).toBe(true);
    });

    test('returns true when cancelled is true even if error is not abort error', () => {
      const signal = new AbortController().signal;
      const error = { message: 'Some other error' };

      expect(shouldIgnoreError(error, signal, true)).toBe(true);
    });
  });

  describe('returns true when signal is aborted', () => {
    test('returns true when signal is aborted and cancelled is false', () => {
      const controller = new AbortController();
      controller.abort();
      const error = new Error('Some error');

      expect(shouldIgnoreError(error, controller.signal, false)).toBe(true);
    });

    test('returns true when signal is aborted regardless of error type', () => {
      const controller = new AbortController();
      controller.abort();
      const error = { message: 'Some error' };

      expect(shouldIgnoreError(error, controller.signal, false)).toBe(true);
    });
  });

  describe('returns true when error is abort error', () => {
    test.each([
      [{ name: 'AbortError' }, 'error with AbortError name'],
      [{ message: 'canceled' }, 'error with canceled message'],
      [{ code: 'ERR_CANCELED' }, 'error with ERR_CANCELED code'],
    ])('returns true for %s', (error, _description) => {
      const signal = new AbortController().signal;

      expect(shouldIgnoreError(error, signal, false)).toBe(true);
    });
  });

  describe('returns false when no cancellation indicators', () => {
    test('returns false when cancelled is false, signal not aborted, and error is not abort error', () => {
      const signal = new AbortController().signal;
      const error = new Error('Some error');

      expect(shouldIgnoreError(error, signal, false)).toBe(false);
    });

    test('returns false for non-abort errors with no cancellation', () => {
      const signal = new AbortController().signal;
      const error = { message: 'Some other error' };

      expect(shouldIgnoreError(error, signal, false)).toBe(false);
    });
  });

  describe('parameter combinations', () => {
    test('returns true when all indicators are false except cancelled', () => {
      const signal = new AbortController().signal;
      const error = new Error('Error');

      expect(shouldIgnoreError(error, signal, true)).toBe(true);
    });

    test('returns true when all indicators are false except signal aborted', () => {
      const controller = new AbortController();
      controller.abort();
      const error = new Error('Error');

      expect(shouldIgnoreError(error, controller.signal, false)).toBe(true);
    });

    test('returns true when all indicators are false except error is abort error', () => {
      const signal = new AbortController().signal;
      const error = { name: 'AbortError' };

      expect(shouldIgnoreError(error, signal, false)).toBe(true);
    });

    test('returns false when all indicators are false', () => {
      const signal = new AbortController().signal;
      const error = new Error('Error');

      expect(shouldIgnoreError(error, signal, false)).toBe(false);
    });
  });
});

describe('getUserFriendlyErrorMessage', () => {
  const defaultMessage = 'Something went wrong';

  describe('returns defaultMessage for null/undefined errors', () => {
    test('returns defaultMessage when error is null', () => {
      expect(getUserFriendlyErrorMessage(null, defaultMessage)).toBe(defaultMessage);
    });

    test('returns defaultMessage when error is undefined', () => {
      expect(getUserFriendlyErrorMessage(undefined, defaultMessage)).toBe(defaultMessage);
    });
  });

  describe('extracts message from HTTP response data', () => {
    test('returns response.data.message when present', () => {
      const error = {
        response: {
          data: {
            message: 'Custom error message from server',
          },
        },
      };

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe('Custom error message from server');
    });

    test('prefers response.data.message over status codes', () => {
      const error = {
        response: {
          data: {
            message: 'Custom message',
          },
          status: 500,
        },
      };

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe('Custom message');
    });
  });

  describe('status code messages', () => {
    test.each([
      [401, 'Please log in to view this information'],
      [403, 'You do not have permission to access this resource'],
      [404, 'The requested information was not found'],
      [500, 'The server is temporarily unavailable. Please try again later'],
      [502, 'The server is temporarily unavailable. Please try again later'],
      [503, 'The server is temporarily unavailable. Please try again later'],
      [504, 'The request timed out. Please try again'],
    ])('returns correct message for status code %d', (status, expectedMessage) => {
      const error = { response: { status } };

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe(expectedMessage);
    });

    test('returns correct message for status in error object', () => {
      const error = { status: 401 };

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe('Please log in to view this information');
    });
  });

  describe('generic status code messages', () => {
    test.each([
      [400, 'There was a problem with your request. Please try again'],
      [405, 'There was a problem with your request. Please try again'],
      [422, 'There was a problem with your request. Please try again'],
      [499, 'There was a problem with your request. Please try again'],
    ])('returns generic 4xx message for status %d', (status, expectedMessage) => {
      const error = { response: { status } };

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe(expectedMessage);
    });

    test.each([
      [501, 'A server error occurred. Please try again later'],
      [505, 'A server error occurred. Please try again later'],
      [599, 'A server error occurred. Please try again later'],
    ])('returns generic 5xx message for status %d', (status, expectedMessage) => {
      const error = { response: { status } };

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe(expectedMessage);
    });
  });

  describe('Error object messages', () => {
    test('returns Error.message for Error instances', () => {
      const error = new Error('Custom error message');

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe('Custom error message');
    });

    test('transforms network errors to user-friendly message', () => {
      const error = new Error('Network error occurred');

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe('Unable to connect to the server. Please check your internet connection');
    });

    test('transforms fetch errors to user-friendly message', () => {
      const error = new Error('Failed to fetch data');

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe('Unable to connect to the server. Please check your internet connection');
    });

    test('transforms timeout errors to user-friendly message', () => {
      const error = new Error('Request timeout');

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe('The request took too long. Please try again');
    });
  });

  describe('fallback to defaultMessage', () => {
    test('returns defaultMessage when error has no parseable information', () => {
      const error = {};

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe(defaultMessage);
    });

    test('returns defaultMessage for non-Error objects without message', () => {
      const error = { someProperty: 'value' };

      expect(getUserFriendlyErrorMessage(error, defaultMessage)).toBe(defaultMessage);
    });

    test('returns defaultMessage for primitive types', () => {
      expect(getUserFriendlyErrorMessage('string', defaultMessage)).toBe(defaultMessage);
      expect(getUserFriendlyErrorMessage(123, defaultMessage)).toBe(defaultMessage);
      expect(getUserFriendlyErrorMessage(true, defaultMessage)).toBe(defaultMessage);
    });
  });
});

describe('createAbortCleanup', () => {
  describe('returns a function', () => {
    test('returns a function when called with valid parameters', () => {
      const controller = new AbortController();
      const cancelledRef = { current: false };

      const cleanup = createAbortCleanup(controller, cancelledRef);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('cleanup function behavior', () => {
    test('sets cancelledRef.current to true when called', () => {
      const controller = new AbortController();
      const cancelledRef = { current: false };

      const cleanup = createAbortCleanup(controller, cancelledRef);
      cleanup();

      expect(cancelledRef.current).toBe(true);
    });

    test('calls abortController.abort() when called', () => {
      const controller = new AbortController();
      const cancelledRef = { current: false };

      const cleanup = createAbortCleanup(controller, cancelledRef);
      cleanup();

      expect(controller.signal.aborted).toBe(true);
    });

    test('performs both operations when called', () => {
      const controller = new AbortController();
      const cancelledRef = { current: false };

      const cleanup = createAbortCleanup(controller, cancelledRef);
      cleanup();

      expect(cancelledRef.current).toBe(true);
      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe('idempotent behavior', () => {
    test('handles multiple calls without errors', () => {
      const controller = new AbortController();
      const cancelledRef = { current: false };

      const cleanup = createAbortCleanup(controller, cancelledRef);

      expect(() => {
        cleanup();
        cleanup();
        cleanup();
      }).not.toThrow();
    });

    test('maintains correct state after multiple calls', () => {
      const controller = new AbortController();
      const cancelledRef = { current: false };

      const cleanup = createAbortCleanup(controller, cancelledRef);
      cleanup();
      cleanup();

      expect(cancelledRef.current).toBe(true);
      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe('observable state changes', () => {
    test('observable state changes match expected behavior', () => {
      const controller = new AbortController();
      const cancelledRef = { current: false };

      expect(cancelledRef.current).toBe(false);
      expect(controller.signal.aborted).toBe(false);

      const cleanup = createAbortCleanup(controller, cancelledRef);
      cleanup();

      expect(cancelledRef.current).toBe(true);
      expect(controller.signal.aborted).toBe(true);
    });
  });
});

