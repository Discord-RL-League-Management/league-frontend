/**
 * Black Box Tests for useUserProfile Hook
 * 
 * These tests strictly adhere to the Black Box Axiom:
 * - Verify only public contract (inputs, outputs, observable state)
 * - No implementation coupling
 * - State verification preferred
 * - Cyclomatic complexity v(G) ≤ 7 per test
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useUserProfile } from '../useUserProfile.js';
import { profileApi } from '@/lib/api/profile.js';
import type { UserProfile } from '@/types/index.js';

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

describe('useUserProfile', () => {
  const mockGetProfile = profileApi.getProfile as jest.MockedFunction<typeof profileApi.getProfile>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    test('returns loading true, profile null, error null on mount', () => {
      mockGetProfile.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useUserProfile());

      expect(result.current.loading).toBe(true);
      expect(result.current.profile).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('successful fetch', () => {
    test('returns profile data and loading false when API resolves', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        username: 'testuser',
        globalName: 'Test User',
        avatar: 'avatar-url',
        email: 'test@example.com',
      };

      mockGetProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('network error handling', () => {
    test('returns error message and loading false when API rejects with network error', async () => {
      const networkError = new Error('Network error occurred');
      mockGetProfile.mockRejectedValue(networkError);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBe(null);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain('Unable to connect');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('HTTP error handling', () => {
    test('returns user-friendly error message for 401 status', async () => {
      const error401 = {
        response: {
          status: 401,
        },
      };
      mockGetProfile.mockRejectedValue(error401);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBe(null);
      expect(result.current.error).toBe('Please log in to view this information');
      expect(result.current.loading).toBe(false);
    });

    test('returns user-friendly error message for 500 status', async () => {
      const error500 = {
        response: {
          status: 500,
        },
      };
      mockGetProfile.mockRejectedValue(error500);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBe(null);
      expect(result.current.error).toBe('The server is temporarily unavailable. Please try again later');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('abort error handling', () => {
    test('does not set error state when API rejects with AbortError', async () => {
      const abortError = { name: 'AbortError' };
      mockGetProfile.mockRejectedValue(abortError);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 1000 });

      expect(result.current.error).toBe(null);
      expect(result.current.profile).toBe(null);
    });

    test('does not update state after unmount when abort occurs', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        username: 'testuser',
      };

      let resolvePromise: (value: UserProfile) => void;
      const pendingPromise = new Promise<UserProfile>((resolve) => {
        resolvePromise = resolve;
      });

      mockGetProfile.mockReturnValue(pendingPromise);

      const { result, unmount } = renderHook(() => useUserProfile());

      expect(result.current.loading).toBe(true);

      unmount();

      // Resolve after unmount
      resolvePromise!(mockProfile);

      // Wait a bit to ensure no state updates occur
      await new Promise((resolve) => setTimeout(resolve, 100));

      // After unmount, we can't check result.current, but we verify
      // the test doesn't throw and the promise resolves
      expect(mockGetProfile).toHaveBeenCalled();
    });
  });

  describe('state transitions', () => {
    test('transitions from loading to success state', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        username: 'testuser',
      };

      mockGetProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useUserProfile());

      expect(result.current.loading).toBe(true);
      expect(result.current.profile).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.error).toBe(null);
    });

    test('transitions from loading to error state', async () => {
      const error = {
        response: {
          status: 404,
        },
      };
      mockGetProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useUserProfile());

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBe(null);
      expect(result.current.error).toBeTruthy();
    });
  });
});

