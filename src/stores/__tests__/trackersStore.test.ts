import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useTrackersStore } from '../trackersStore';
import * as trackerApiModule from '../../lib/api/trackers';
import type { Tracker } from '../../types/trackers';

// Mock the tracker API
jest.mock('../../lib/api/trackers', () => ({
  trackerApi: {
    getMyTrackers: jest.fn(),
  },
}));

const mockTrackerApi = trackerApiModule.trackerApi as jest.Mocked<typeof trackerApiModule.trackerApi>;

// Helper to create mock tracker
const createMockTracker = (overrides?: Partial<Tracker>): Tracker => ({
  id: '1',
  url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/test',
  game: 'ROCKET_LEAGUE',
  platform: 'STEAM',
  username: 'test',
  userId: '123',
  displayName: 'test',
  isActive: true,
  isDeleted: false,
  lastScrapedAt: null,
  scrapingStatus: 'COMPLETED',
  scrapingError: null,
  scrapingAttempts: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('trackersStore.getMyTrackers', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTrackersStore.setState({
      myTrackers: [],
      myTrackersLastFetched: null,
      loading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('should only make one API call when multiple getMyTrackers calls happen simultaneously', async () => {
    // Input: Multiple simultaneous calls (simulating race condition)
    const mockTrackers = [createMockTracker()];
    
    // Simulate slow API response to allow multiple calls before first completes
    // This creates a window where race conditions can occur
    let resolveApiCall: (value: Tracker[]) => void;
    const delayedApiCall = new Promise<Tracker[]>((resolve) => {
      resolveApiCall = resolve;
    });
    mockTrackerApi.getMyTrackers.mockReturnValue(delayedApiCall);

    // Act: Call getMyTrackers multiple times in rapid succession (simulating race condition)
    // These calls happen before the first API call completes
    const promise1 = useTrackersStore.getState().getMyTrackers();
    const promise2 = useTrackersStore.getState().getMyTrackers();
    const promise3 = useTrackersStore.getState().getMyTrackers();
    const promise4 = useTrackersStore.getState().getMyTrackers();
    const promise5 = useTrackersStore.getState().getMyTrackers();

    // Verify flag was set synchronously (before API call completes)
    const stateDuringCall = useTrackersStore.getState();
    expect(stateDuringCall.myTrackersRequestInFlight).not.toBeNull();

    // Resolve the API call
    resolveApiCall!(mockTrackers);
    
    // Wait for all promises to resolve
    await Promise.all([promise1, promise2, promise3, promise4, promise5]);

    // Output: Only one API call should be made, despite 5 simultaneous calls
    expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    
    // Output: All calls should resolve successfully with the same data
    const finalState = useTrackersStore.getState();
    expect(finalState.myTrackers).toEqual(mockTrackers);
    expect(finalState.myTrackersRequestInFlight).toBeNull();
  });

  it('should not make API call when data is fresh', async () => {
    // Input: Fresh cached data (within 30s TTL)
    const mockTrackers = [createMockTracker()];
    
    useTrackersStore.setState({
      myTrackers: mockTrackers,
      myTrackersLastFetched: Date.now() - 10000, // 10 seconds ago
    });

    // Act: Request trackers
    await useTrackersStore.getState().getMyTrackers();

    // Output: No API call should be made
    expect(mockTrackerApi.getMyTrackers).not.toHaveBeenCalled();
    
    // Output: Data should remain unchanged
    const state = useTrackersStore.getState();
    expect(state.myTrackers).toEqual(mockTrackers);
  });

  it('should fetch fresh data when cache is stale', async () => {
    // Input: Stale cached data (older than 30s TTL)
    const freshTrackers = [createMockTracker()];
    mockTrackerApi.getMyTrackers.mockResolvedValue(freshTrackers);
    
    useTrackersStore.setState({
      myTrackers: [createMockTracker({ id: 'old', username: 'old' })],
      myTrackersLastFetched: Date.now() - 40000, // 40 seconds ago
    });

    // Act: Request trackers
    await useTrackersStore.getState().getMyTrackers();

    // Output: API call should be made
    expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    
    // Output: Data should be updated with fresh data
    const state = useTrackersStore.getState();
    expect(state.myTrackers).toEqual(freshTrackers);
  });

  it('should fetch fresh data when force flag is true, even with fresh cache', async () => {
    // Input: Fresh cached data + force flag
    const freshTrackers = [createMockTracker()];
    mockTrackerApi.getMyTrackers.mockResolvedValue(freshTrackers);
    
    useTrackersStore.setState({
      myTrackers: [createMockTracker({ id: 'old', username: 'old' })],
      myTrackersLastFetched: Date.now() - 10000, // 10 seconds ago (fresh)
    });

    // Act: Request trackers with force flag
    await useTrackersStore.getState().getMyTrackers(true);

    // Output: API call should be made despite fresh cache
    expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    
    // Output: Data should be updated
    const state = useTrackersStore.getState();
    expect(state.myTrackers).toEqual(freshTrackers);
  });

  it('should handle 429 rate limit errors without retrying', async () => {
    // Input: API returns 429 error
    const rateLimitError = {
      status: 429,
      response: { status: 429, data: { message: 'Too Many Requests' } },
    };
    mockTrackerApi.getMyTrackers.mockRejectedValue(rateLimitError);

    // Act: Request trackers
    await expect(
      useTrackersStore.getState().getMyTrackers()
    ).rejects.toEqual(rateLimitError);

    // Output: Error message should be set
    const state = useTrackersStore.getState();
    expect(state.error).toBe('Too many requests. Please wait a moment before trying again.');
    
    // Output: Subsequent calls should be allowed (not blocked by in-flight request)
    // This is verified by the promise rejecting, allowing new calls
  });

  it('should prevent duplicate requests when calls happen in rapid succession', async () => {
    // Input: Simulating the actual bug - multiple rapid calls before any completes
    const mockTrackers = [createMockTracker()];
    let resolveApiCall: (value: Tracker[]) => void;
    const delayedPromise = new Promise<Tracker[]>((resolve) => {
      resolveApiCall = resolve;
    });
    mockTrackerApi.getMyTrackers.mockReturnValue(delayedPromise);

    // Act: Start first request
    const firstPromise = useTrackersStore.getState().getMyTrackers();
    
    // Verify flag is set immediately (synchronously) - this prevents race conditions
    const stateAfterFirst = useTrackersStore.getState();
    expect(stateAfterFirst.myTrackersRequestInFlight).not.toBeNull();
    
    // Act: Start second request immediately after (simulating race condition)
    const secondPromise = useTrackersStore.getState().getMyTrackers();
    
    // Act: Start third request (simulating multiple components mounting)
    const thirdPromise = useTrackersStore.getState().getMyTrackers();

    // Verify flag is still set (all calls should see the same in-flight request)
    const stateAfterMultiple = useTrackersStore.getState();
    expect(stateAfterMultiple.myTrackersRequestInFlight).not.toBeNull();

    // Resolve the API call
    resolveApiCall!(mockTrackers);
    await Promise.all([firstPromise, secondPromise, thirdPromise]);

    // Output: Only one API call should be made (the bug fix)
    expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    
    // Output: All promises should resolve successfully with same data
    const finalState = useTrackersStore.getState();
    expect(finalState.myTrackers).toEqual(mockTrackers);
    expect(finalState.myTrackersRequestInFlight).toBeNull();
  });

  it('should handle race condition where multiple calls happen simultaneously', async () => {
    // Input: This test simulates the exact race condition bug
    // Multiple components mount simultaneously and all call getMyTrackers()
    const mockTrackers = [createMockTracker()];
    
    // Track API calls to verify deduplication works
    let apiCallCount = 0;
    let resolveApiCall: (value: Tracker[]) => void;
    const delayedPromise = new Promise<Tracker[]>((resolve) => {
      resolveApiCall = resolve;
    });
    
    mockTrackerApi.getMyTrackers.mockImplementation(() => {
      apiCallCount++;
      return delayedPromise;
    });

    // Act: Make multiple calls in rapid succession (simulating race condition)
    // This simulates multiple components mounting at the same time
    const promise1 = useTrackersStore.getState().getMyTrackers();
    const promise2 = useTrackersStore.getState().getMyTrackers();
    const promise3 = useTrackersStore.getState().getMyTrackers();
    const promise4 = useTrackersStore.getState().getMyTrackers();
    const promise5 = useTrackersStore.getState().getMyTrackers();

    // Verify flag was set synchronously (before any async work)
    // This is the key fix - flag must be set before async operations
    const stateAfterCalls = useTrackersStore.getState();
    expect(stateAfterCalls.myTrackersRequestInFlight).not.toBeNull();

    // Resolve the API call
    resolveApiCall!(mockTrackers);
    await Promise.all([promise1, promise2, promise3, promise4, promise5]);

    // Output: Only one API call should be made (the bug we're fixing)
    // This is the critical assertion - without the fix, we'd see 5 API calls
    expect(apiCallCount).toBe(1);
    expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    
    // Output: Store should have the data
    const finalState = useTrackersStore.getState();
    expect(finalState.myTrackers).toEqual(mockTrackers);
    expect(finalState.myTrackersRequestInFlight).toBeNull();
  });
});

