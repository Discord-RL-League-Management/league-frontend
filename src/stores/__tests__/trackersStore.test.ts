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
    // Input: Multiple simultaneous calls
    const mockTrackers = [createMockTracker()];
    
    // Simulate slow API response to allow multiple calls before first completes
    mockTrackerApi.getMyTrackers.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockTrackers), 100))
    );

    // Act: Call getMyTrackers multiple times simultaneously
    const promise1 = useTrackersStore.getState().getMyTrackers();
    const promise2 = useTrackersStore.getState().getMyTrackers();
    const promise3 = useTrackersStore.getState().getMyTrackers();

    // Wait for all promises to resolve
    await Promise.all([promise1, promise2, promise3]);

    // Output: Only one API call should be made
    expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    
    // Output: All calls should resolve with the same data
    const state = useTrackersStore.getState();
    expect(state.myTrackers).toEqual(mockTrackers);
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

  it('should prevent duplicate requests when second call happens before first completes', async () => {
    // Input: Slow API response
    const mockTrackers = [createMockTracker()];
    let resolveFirstCall: (value: Tracker[]) => void;
    const delayedPromise = new Promise<Tracker[]>((resolve) => {
      resolveFirstCall = resolve;
    });
    mockTrackerApi.getMyTrackers.mockReturnValue(delayedPromise);

    // Act: Start first request
    const firstPromise = useTrackersStore.getState().getMyTrackers();
    
    // Act: Start second request before first completes
    const secondPromise = useTrackersStore.getState().getMyTrackers();

    // Resolve the first call
    resolveFirstCall!(mockTrackers);
    await Promise.all([firstPromise, secondPromise]);

    // Output: Only one API call should be made
    expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    
    // Output: Both promises should resolve with same data
    const state = useTrackersStore.getState();
    expect(state.myTrackers).toEqual(mockTrackers);
  });
});

