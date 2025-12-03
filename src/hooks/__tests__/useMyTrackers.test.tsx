import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyTrackers } from '../useMyTrackers';
import { useAuthStore } from '../../stores/index';
import { useTrackersStore } from '../../stores/trackersStore';
import { trackerApi } from '../../lib/api/trackers';

// Mock the stores
jest.mock('../../stores/index', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../../stores/trackersStore', () => ({
  useTrackersStore: jest.fn(),
}));

jest.mock('../../lib/api/trackers', () => ({
  trackerApi: {
    getMyTrackers: jest.fn(),
  },
}));

describe('useMyTrackers hook', () => {
  const mockGetMyTrackers = jest.fn();
  const mockUseAuthStore = useAuthStore as jest.Mock;
  const mockUseTrackersStore = useTrackersStore as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default store state
    mockUseTrackersStore.mockImplementation((selector: any) => {
      const state = {
        myTrackers: [],
        loading: false,
        error: null,
        myTrackersLastFetched: null,
        myTrackersRequestInFlight: null,
        getMyTrackers: mockGetMyTrackers,
      };
      return selector(state);
    });
  });

  it('should not fetch when user is not authenticated', () => {
    // Input: No authenticated user
    mockUseAuthStore.mockReturnValue({ user: null });
    
    // Act: Render hook
    renderHook(() => useMyTrackers());

    // Output: Should not trigger fetch
    expect(mockGetMyTrackers).not.toHaveBeenCalled();
  });

  it('should fetch when user is authenticated and data is empty', async () => {
    // Input: Authenticated user + empty trackers
    const mockTrackers = [{ id: '1', username: 'test' }];
    mockGetMyTrackers.mockResolvedValue(mockTrackers);
    mockUseAuthStore.mockReturnValue({ user: { id: '123' } });
    
    mockUseTrackersStore.mockImplementation((selector: any) => {
      const state = {
        myTrackers: [],
        loading: false,
        error: null,
        myTrackersLastFetched: null,
        myTrackersRequestInFlight: null,
        getMyTrackers: mockGetMyTrackers,
      };
      return selector(state);
    });

    // Act: Render hook
    renderHook(() => useMyTrackers());

    // Output: Should trigger fetch
    await waitFor(() => {
      expect(mockGetMyTrackers).toHaveBeenCalledTimes(1);
    });
  });

  it('should not fetch when data is fresh', () => {
    // Input: Authenticated user + fresh cached data
    mockUseAuthStore.mockReturnValue({ user: { id: '123' } });
    
    mockUseTrackersStore.mockImplementation((selector: any) => {
      const state = {
        myTrackers: [{ id: '1', username: 'test' }],
        loading: false,
        error: null,
        myTrackersLastFetched: Date.now() - 10000, // 10 seconds ago
        myTrackersRequestInFlight: null,
        getMyTrackers: mockGetMyTrackers,
      };
      return selector(state);
    });

    // Act: Render hook
    renderHook(() => useMyTrackers());

    // Output: Should not trigger fetch
    expect(mockGetMyTrackers).not.toHaveBeenCalled();
  });

  it('should fetch when data is stale', async () => {
    // Input: Authenticated user + stale cached data
    mockGetMyTrackers.mockResolvedValue([{ id: '1', username: 'test' }]);
    mockUseAuthStore.mockReturnValue({ user: { id: '123' } });
    
    mockUseTrackersStore.mockImplementation((selector: any) => {
      const state = {
        myTrackers: [{ id: 'old', username: 'old' }],
        loading: false,
        error: null,
        myTrackersLastFetched: Date.now() - 40000, // 40 seconds ago
        myTrackersRequestInFlight: null,
        getMyTrackers: mockGetMyTrackers,
      };
      return selector(state);
    });

    // Act: Render hook
    renderHook(() => useMyTrackers());

    // Output: Should trigger fetch
    await waitFor(() => {
      expect(mockGetMyTrackers).toHaveBeenCalledTimes(1);
    });
  });

  it('should not trigger fetch when another request is already in progress', () => {
    // Input: Request already in flight
    const inFlightPromise = Promise.resolve();
    mockUseAuthStore.mockReturnValue({ user: { id: '123' } });
    
    mockUseTrackersStore.mockImplementation((selector: any) => {
      const state = {
        myTrackers: [],
        loading: false,
        error: null,
        myTrackersLastFetched: null,
        myTrackersRequestInFlight: inFlightPromise,
        getMyTrackers: mockGetMyTrackers,
      };
      return selector(state);
    });

    // Act: Render hook
    renderHook(() => useMyTrackers());

    // Output: Should not trigger another fetch
    expect(mockGetMyTrackers).not.toHaveBeenCalled();
  });

  it('should return trackers, loading state, and error from store', () => {
    // Input: Store has trackers, loading, and error state
    mockUseAuthStore.mockReturnValue({ user: { id: '123' } });
    
    mockUseTrackersStore.mockImplementation((selector: any) => {
      const state = {
        myTrackers: [{ id: '1', username: 'test' }],
        loading: true,
        error: 'Some error',
        myTrackersLastFetched: Date.now() - 10000,
        myTrackersRequestInFlight: null,
        getMyTrackers: mockGetMyTrackers,
      };
      return selector(state);
    });

    // Act: Render hook
    const { result } = renderHook(() => useMyTrackers());

    // Output: Should return store values
    expect(result.current.myTrackers).toEqual([{ id: '1', username: 'test' }]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Some error');
  });

  it('should only trigger one fetch when multiple hook instances mount simultaneously', async () => {
    // Input: Multiple hook instances mounting at the same time
    const mockTrackers = [{ id: '1', username: 'test' }];
    mockGetMyTrackers.mockResolvedValue(mockTrackers);
    mockUseAuthStore.mockReturnValue({ user: { id: '123' } });
    
    // Simulate store's deduplication behavior
    let requestInFlight: Promise<any> | null = null;
    mockUseTrackersStore.mockImplementation((selector: any) => {
      const state = {
        myTrackers: [],
        loading: false,
        error: null,
        myTrackersLastFetched: null,
        myTrackersRequestInFlight: requestInFlight,
        getMyTrackers: () => {
          if (!requestInFlight) {
            requestInFlight = mockGetMyTrackers();
          }
          return requestInFlight;
        },
      };
      return selector(state);
    });

    // Act: Render multiple hook instances simultaneously
    renderHook(() => useMyTrackers());
    renderHook(() => useMyTrackers());
    renderHook(() => useMyTrackers());

    // Output: Only one API call should be made
    await waitFor(() => {
      expect(mockGetMyTrackers).toHaveBeenCalledTimes(1);
    });
  });
});

