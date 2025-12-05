/**
 * Black Box Tests for useErrorHandler Hook
 * 
 * These tests strictly adhere to the Black Box Axiom:
 * - Verify only public contract (inputs, outputs, observable state)
 * - No implementation coupling
 * - State verification preferred
 * - Cyclomatic complexity v(G) ≤ 7 per test
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler.js';

describe('useErrorHandler', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('initial state', () => {
    test('returns error null, loading false, and functions on mount', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(typeof result.current.handleAsync).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('successful operation flow', () => {
    test('returns resolved value and maintains correct state during successful operation', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const testValue = { id: 123, name: 'test' };
      let resolveFn: (value: typeof testValue) => void;
      const asyncFn = jest.fn().mockImplementation(() => {
        return new Promise<typeof testValue>((resolve) => {
          resolveFn = resolve;
        });
      });

      const promise = result.current.handleAsync(asyncFn);

      // Wait for loading to be true (React state updates are async)
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });
      expect(result.current.error).toBe(null);

      // Now resolve the promise
      resolveFn!(testValue);
      const returnValue = await promise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(returnValue).toEqual(testValue);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    test('clears error state at start of new operation', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      // First, create an error state
      const error = { response: { data: { message: 'First error' } } };
      await result.current.handleAsync(async () => {
        throw error;
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      // Now run a successful operation - error should be cleared at start
      const testValue = 'success';
      const promise = result.current.handleAsync(async () => testValue);

      // Wait for error to be cleared (happens at start of handleAsync)
      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });

      await promise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('error handling - API error with full structure', () => {
    test('extracts all error fields from response.data structure', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const apiError = {
        response: {
          data: {
            message: 'API error message',
            code: 'ERROR_CODE_123',
            details: { field: 'value', count: 42 },
          },
        },
      };

      await result.current.handleAsync(async () => {
        throw apiError;
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual({
        message: 'API error message',
        code: 'ERROR_CODE_123',
        details: { field: 'value', count: 42 },
      });
      expect(result.current.loading).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Async operation failed:', apiError);
    });

    test('extracts only message when code and details are missing', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const apiError = {
        response: {
          data: {
            message: 'Simple API error',
          },
        },
      };

      await result.current.handleAsync(async () => {
        throw apiError;
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual({
        message: 'Simple API error',
        code: undefined,
        details: undefined,
      });
      expect(result.current.loading).toBe(false);
    });
  });

  describe('error handling - plain error object', () => {
    test('extracts message from plain error object', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const plainError = { message: 'Plain error message' };

      await result.current.handleAsync(async () => {
        throw plainError;
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual({
        message: 'Plain error message',
        code: undefined,
        details: undefined,
      });
      expect(result.current.loading).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Async operation failed:', plainError);
    });
  });

  describe('error handling - error without message', () => {
    test('uses default message when error has no message property', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorWithoutMessage = {};

      await result.current.handleAsync(async () => {
        throw errorWithoutMessage;
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual({
        message: 'An error occurred',
        code: undefined,
        details: undefined,
      });
      expect(result.current.loading).toBe(false);
    });

    test('uses default message when error has neither response nor message', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const unexpectedError = { someProperty: 'value' };

      await result.current.handleAsync(async () => {
        throw unexpectedError;
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual({
        message: 'An error occurred',
        code: undefined,
        details: undefined,
      });
      expect(result.current.loading).toBe(false);
    });
  });

  describe('loading state transitions', () => {
    test('sets loading to true immediately when handleAsync is called', async () => {
      const { result } = renderHook(() => useErrorHandler());
      let resolvePromise: (value: string) => void;
      const pendingPromise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      const promise = result.current.handleAsync(async () => pendingPromise);

      // Wait for loading to be true (React state updates are async)
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });
      expect(result.current.error).toBe(null);

      resolvePromise!('resolved');
      await promise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loading).toBe(false);
    });

    test('sets loading to false in finally block even on error', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Test error');

      await result.current.handleAsync(async () => {
        throw error;
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).not.toBe(null);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBe(null);
    });

    test('maintains correct loading state with multiple rapid calls', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const promise1 = result.current.handleAsync(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'first';
      });
      
      const promise2 = result.current.handleAsync(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'second';
      });

      // Both operations should complete
      await Promise.all([promise1, promise2]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('clearError functionality', () => {
    test('sets error to null when clearError is called', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = { response: { data: { message: 'Test error' } } };

      await result.current.handleAsync(async () => {
        throw error;
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      result.current.clearError();

      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });

      expect(result.current.error).toBe(null);
    });

    test('does not affect loading state when clearError is called', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = { response: { data: { message: 'Test error' } } };

      await result.current.handleAsync(async () => {
        throw error;
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const loadingBeforeClear = result.current.loading;
      result.current.clearError();

      expect(result.current.loading).toBe(loadingBeforeClear);
      expect(result.current.loading).toBe(false);
    });

    test('works after error has been set', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = { message: 'Error message' };

      await result.current.handleAsync(async () => {
        throw error;
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      expect(result.current.error?.message).toBe('Error message');

      result.current.clearError();

      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('error clearing on new operation', () => {
    test('clears previous error state when handleAsync is called', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const firstError = { response: { data: { message: 'First error' } } };

      await result.current.handleAsync(async () => {
        throw firstError;
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
        expect(result.current.error?.message).toBe('First error');
      });

      const secondError = { response: { data: { message: 'Second error' } } };
      const promise = result.current.handleAsync(async () => {
        throw secondError;
      });

      // Error should be cleared at start, then set to second error
      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
        expect(result.current.loading).toBe(false);
      });

      await promise;

      // Should have the second error, not the first
      await waitFor(() => {
        expect(result.current.error?.message).toBe('Second error');
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error?.message).toBe('Second error');
      expect(result.current.loading).toBe(false);
    });

    test('clears error before setting loading to true', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const firstError = { response: { data: { message: 'First error' } } };

      await result.current.handleAsync(async () => {
        throw firstError;
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      // Start new operation
      let errorCleared = false;
      const checkErrorCleared = new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (result.current.error === null && result.current.loading === true) {
            errorCleared = true;
            clearInterval(checkInterval);
            resolve();
          }
        }, 1);
      });

      result.current.handleAsync(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'success';
      });

      await checkErrorCleared;
      expect(errorCleared).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(true);
    });
  });

  describe('return value verification', () => {
    test('returns null on error', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = { message: 'Test error' };

      const returnValue = await result.current.handleAsync(async () => {
        throw error;
      });

      expect(returnValue).toBe(null);
      
      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      expect(result.current.error).not.toBe(null);
    });

    test('returns resolved value on success', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const testValue = 42;

      const returnValue = await result.current.handleAsync(async () => testValue);

      expect(returnValue).toBe(42);
      expect(result.current.error).toBe(null);
    });

    test('preserves return value type for different types', async () => {
      const { result } = renderHook(() => useErrorHandler());

      const stringValue = await result.current.handleAsync(async () => 'string');
      const numberValue = await result.current.handleAsync(async () => 123);
      const objectValue = await result.current.handleAsync(async () => ({ key: 'value' }));
      const arrayValue = await result.current.handleAsync(async () => [1, 2, 3]);

      expect(stringValue).toBe('string');
      expect(numberValue).toBe(123);
      expect(objectValue).toEqual({ key: 'value' });
      expect(arrayValue).toEqual([1, 2, 3]);
    });
  });
});

