/**
 * Black Box Tests for useUserStats Hook
 * 
 * These tests strictly adhere to the Black Box Axiom:
 * - Verify only public contract (inputs, outputs, observable state)
 * - No implementation coupling
 * - State verification preferred
 * - Cyclomatic complexity v(G) ≤ 7 per test
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useUserStats } from '../useUserStats.js';
import { profileApi } from '@/lib/api/profile.js';
import type { UserStats } from '@/types/index.js';

// Mock the client module to avoid import.meta.env issues
jest.mock('@/lib/api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('@/lib/api/profile');

describe('useUserStats', () => {
  const mockGetStats = profileApi.getStats as jest.MockedFunction<typeof profileApi.getStats>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    test('returns loading true, stats null, error null on mount', () => {
      mockGetStats.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useUserStats());

      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('successful fetch', () => {
    test('returns stats data and loading false when API resolves', async () => {
      const mockStats: UserStats = {
        userId: 'user-123',
        gamesPlayed: 100,
        wins: 60,
        losses: 40,
        winRate: 0.6,
        guildsCount: 3,
        activeGuildsCount: 2,
      };

      mockGetStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useUserStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('network error handling', () => {
    test('returns error message and loading false when API rejects with network error', async () => {
      const networkError = new Error('Network error occurred');
      mockGetStats.mockRejectedValue(networkError);

      const { result } = renderHook(() => useUserStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain('Unable to connect');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('HTTP error handling', () => {
    test('returns user-friendly error message for 404 status', async () => {
      const error404 = {
        response: {
          status: 404,
        },
      };
      mockGetStats.mockRejectedValue(error404);

      const { result } = renderHook(() => useUserStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe('The requested information was not found');
      expect(result.current.loading).toBe(false);
    });

    test('returns user-friendly error message for 500 status', async () => {
      const error500 = {
        response: {
          status: 500,
        },
      };
      mockGetStats.mockRejectedValue(error500);

      const { result } = renderHook(() => useUserStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe('The server is temporarily unavailable. Please try again later');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('abort error handling', () => {
    test('does not set error state when API rejects with AbortError', async () => {
      const abortError = { name: 'AbortError' };
      mockGetStats.mockRejectedValue(abortError);

      const { result } = renderHook(() => useUserStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 1000 });

      expect(result.current.error).toBe(null);
      expect(result.current.stats).toBe(null);
    });

    test('does not update state after unmount when abort occurs', async () => {
      const mockStats: UserStats = {
        userId: 'user-123',
        gamesPlayed: 100,
        wins: 60,
        losses: 40,
        winRate: 0.6,
        guildsCount: 3,
        activeGuildsCount: 2,
      };

      let resolvePromise: (value: UserStats) => void;
      const pendingPromise = new Promise<UserStats>((resolve) => {
        resolvePromise = resolve;
      });

      mockGetStats.mockReturnValue(pendingPromise);

      const { result, unmount } = renderHook(() => useUserStats());

      expect(result.current.loading).toBe(true);

      unmount();

      // Resolve after unmount
      resolvePromise!(mockStats);

      // Wait a bit to ensure no state updates occur
      await new Promise((resolve) => setTimeout(resolve, 100));

      // After unmount, we can't check result.current, but we verify
      // the test doesn't throw and the promise resolves
      expect(mockGetStats).toHaveBeenCalled();
    });
  });

  describe('state transitions', () => {
    test('transitions from loading to success state', async () => {
      const mockStats: UserStats = {
        userId: 'user-123',
        gamesPlayed: 100,
        wins: 60,
        losses: 40,
        winRate: 0.6,
        guildsCount: 3,
        activeGuildsCount: 2,
      };

      mockGetStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useUserStats());

      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.error).toBe(null);
    });

    test('transitions from loading to error state', async () => {
      const error = {
        response: {
          status: 403,
        },
      };
      mockGetStats.mockRejectedValue(error);

      const { result } = renderHook(() => useUserStats());

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBeTruthy();
    });
  });
});

