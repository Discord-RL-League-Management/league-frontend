import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { useTrackersStore } from '../trackersStore';
import * as trackerApiModule from '../../lib/api/trackers';

// Mock the tracker API
jest.mock('../../lib/api/trackers', () => ({
  trackerApi: {
    getMyTrackers: jest.fn(),
  },
}));

const mockTrackerApi = trackerApiModule.trackerApi as jest.Mocked<typeof trackerApiModule.trackerApi>;

describe('trackersStore - getMyTrackers deduplication', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTrackersStore.setState({
      myTrackers: [],
      myTrackersLastFetched: null,
      myTrackersRequestInFlight: null,
      loading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending promises
    useTrackersStore.setState({
      myTrackersRequestInFlight: null,
    });
  });

  it('should only make one API call when multiple getMyTrackers calls happen simultaneously', async () => {
    const mockTrackers = [{ id: '1', username: 'test' }];
    
    // Simulate slow API response
    mockTrackerApi.getMyTrackers.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockTrackers), 100))
    );

    // Call getMyTrackers multiple times simultaneously
    const promise1 = useTrackersStore.getState().getMyTrackers();
    const promise2 = useTrackersStore.getState().getMyTrackers();
    const promise3 = useTrackersStore.getState().getMyTrackers();

    // Wait for all promises to resolve
    await Promise.all([promise1, promise2, promise3]);

    // Should only have made ONE API call
    expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    
    // All promises should resolve successfully
    const state = useTrackersStore.getState();
    expect(state.myTrackers).toEqual(mockTrackers);
    expect(state.myTrackersRequestInFlight).toBeNull();
  });

  it('should return cached data if within TTL', async () => {
    const mockTrackers = [{ id: '1', username: 'test' }];
    
    // Set up cached data
    useTrackersStore.setState({
      myTrackers: mockTrackers,
      myTrackersLastFetched: Date.now() - 10000, // 10 seconds ago (within 30s TTL)
    });

    // Call getMyTrackers
    await useTrackersStore.getState().getMyTrackers();

    // Should NOT make an API call (uses cache)
    expect(mockTrackerApi.getMyTrackers).not.toHaveBeenCalled();
  });

  it('should fetch fresh data if cache is stale', async () => {
    const mockTrackers = [{ id: '1', username: 'test' }];
    mockTrackerApi.getMyTrackers.mockResolvedValue(mockTrackers);
    
    // Set up stale cached data
    useTrackersStore.setState({
      myTrackers: [{ id: 'old', username: 'old' }],
      myTrackersLastFetched: Date.now() - 40000, // 40 seconds ago (stale)
    });

    // Call getMyTrackers
    await useTrackersStore.getState().getMyTrackers();

    // Should make an API call
    expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    
    const state = useTrackersStore.getState();
    expect(state.myTrackers).toEqual(mockTrackers);
  });

  it('should handle force refresh even with cached data', async () => {
    const mockTrackers = [{ id: '1', username: 'test' }];
    mockTrackerApi.getMyTrackers.mockResolvedValue(mockTrackers);
    
    // Set up fresh cached data
    useTrackersStore.setState({
      myTrackers: [{ id: 'old', username: 'old' }],
      myTrackersLastFetched: Date.now() - 10000, // 10 seconds ago (fresh)
    });

    // Call getMyTrackers with force flag
    await useTrackersStore.getState().getMyTrackers(true);

    // Should make an API call despite fresh cache
    expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    
    const state = useTrackersStore.getState();
    expect(state.myTrackers).toEqual(mockTrackers);
  });

  it('should handle 429 rate limit errors gracefully', async () => {
    const rateLimitError = {
      status: 429,
      response: { status: 429, data: { message: 'Too Many Requests' } },
    };
    mockTrackerApi.getMyTrackers.mockRejectedValue(rateLimitError);

    // Call getMyTrackers
    await expect(
      useTrackersStore.getState().getMyTrackers()
    ).rejects.toEqual(rateLimitError);

    // Should clear in-flight flag
    const state = useTrackersStore.getState();
    expect(state.myTrackersRequestInFlight).toBeNull();
    expect(state.error).toBe('Too many requests. Please wait a moment before trying again.');
  });

  it('should set in-flight flag synchronously before async work', async () => {
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockTrackerApi.getMyTrackers.mockReturnValue(delayedPromise);

    // Start the request
    const promise = useTrackersStore.getState().getMyTrackers();

    // Immediately check if flag is set (synchronously)
    const stateBeforeResolve = useTrackersStore.getState();
    expect(stateBeforeResolve.myTrackersRequestInFlight).not.toBeNull();

    // Resolve the promise
    resolvePromise!([{ id: '1', username: 'test' }]);
    await promise;

    // Flag should be cleared after completion
    const stateAfterResolve = useTrackersStore.getState();
    expect(stateAfterResolve.myTrackersRequestInFlight).toBeNull();
  });
});

