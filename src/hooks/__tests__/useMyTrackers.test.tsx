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
    mockUseAuthStore.mockReturnValue({ user: null });
    
    renderHook(() => useMyTrackers());

    expect(mockGetMyTrackers).not.toHaveBeenCalled();
  });

  it('should fetch when user is authenticated and data is empty', async () => {
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

    renderHook(() => useMyTrackers());

    await waitFor(() => {
      expect(mockGetMyTrackers).toHaveBeenCalledTimes(1);
    });
  });

  it('should not fetch when data is fresh', () => {
    mockUseAuthStore.mockReturnValue({ user: { id: '123' } });
    
    mockUseTrackersStore.mockImplementation((selector: any) => {
      const state = {
        myTrackers: [{ id: '1', username: 'test' }],
        loading: false,
        error: null,
        myTrackersLastFetched: Date.now() - 10000, // 10 seconds ago (fresh)
        myTrackersRequestInFlight: null,
        getMyTrackers: mockGetMyTrackers,
      };
      return selector(state);
    });

    renderHook(() => useMyTrackers());

    expect(mockGetMyTrackers).not.toHaveBeenCalled();
  });

  it('should fetch when data is stale', async () => {
    mockGetMyTrackers.mockResolvedValue([{ id: '1', username: 'test' }]);
    mockUseAuthStore.mockReturnValue({ user: { id: '123' } });
    
    mockUseTrackersStore.mockImplementation((selector: any) => {
      const state = {
        myTrackers: [{ id: 'old', username: 'old' }],
        loading: false,
        error: null,
        myTrackersLastFetched: Date.now() - 40000, // 40 seconds ago (stale)
        myTrackersRequestInFlight: null,
        getMyTrackers: mockGetMyTrackers,
      };
      return selector(state);
    });

    renderHook(() => useMyTrackers());

    await waitFor(() => {
      expect(mockGetMyTrackers).toHaveBeenCalledTimes(1);
    });
  });

  it('should not fetch when request is already in flight', () => {
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

    renderHook(() => useMyTrackers());

    // Should not call getMyTrackers because there's already a request in flight
    expect(mockGetMyTrackers).not.toHaveBeenCalled();
  });

  it('should return trackers, loading, and error from store', () => {
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

    const { result } = renderHook(() => useMyTrackers());

    expect(result.current.myTrackers).toEqual([{ id: '1', username: 'test' }]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Some error');
  });

  it('should handle multiple hook instances without duplicate fetches', async () => {
    mockGetMyTrackers.mockResolvedValue([{ id: '1', username: 'test' }]);
    mockUseAuthStore.mockReturnValue({ user: { id: '123' } });
    
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

    // Render multiple hook instances simultaneously
    renderHook(() => useMyTrackers());
    renderHook(() => useMyTrackers());
    renderHook(() => useMyTrackers());

    await waitFor(() => {
      // Should only make one API call even with multiple hook instances
      expect(mockGetMyTrackers).toHaveBeenCalledTimes(1);
    });
  });
});

