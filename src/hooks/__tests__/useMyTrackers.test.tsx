import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import type { Tracker } from '../../types/trackers';
import type { User } from '../../types/user';

// Mock the API client first (before other imports that use it)
jest.mock('../../lib/api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock auth API to avoid import.meta issues
jest.mock('../../lib/api/auth', () => ({
  authApi: {
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
  },
}));

// Mock the tracker API
jest.mock('../../lib/api/trackers', () => ({
  trackerApi: {
    getMyTrackers: jest.fn(),
  },
}));

// Import after mocks
import { useMyTrackers } from '../useMyTrackers';
import { useAuthStore } from '../../stores/index';
import { useTrackersStore } from '../../stores/trackersStore';
import { trackerApi } from '../../lib/api/trackers';

const mockTrackerApi = trackerApi as jest.Mocked<typeof trackerApi>;

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

// Helper to create mock user
const createMockUser = (overrides?: Partial<User>): User => ({
  id: '123',
  username: 'test',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  ...overrides,
});

describe('useMyTrackers hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset stores to default state
    useAuthStore.setState({ user: null });
    useTrackersStore.setState({
      myTrackers: [],
      loading: false,
      error: null,
      myTrackersLastFetched: null,
      myTrackersRequestInFlight: null,
    });
  });

  it('should not fetch when user is not authenticated', () => {
    // Input: No authenticated user
    useAuthStore.setState({ user: null });
    
    // Act: Render hook
    renderHook(() => useMyTrackers());

    // Output: Should not trigger fetch
    expect(mockTrackerApi.getMyTrackers).not.toHaveBeenCalled();
  });

  it('should fetch when user is authenticated and data is empty', async () => {
    // Input: Authenticated user + empty trackers
    const mockTrackers = [createMockTracker()];
    mockTrackerApi.getMyTrackers.mockResolvedValue(mockTrackers);
    useAuthStore.setState({ user: createMockUser() });
    
    // Act: Render hook
    renderHook(() => useMyTrackers());

    // Output: Should trigger fetch
    await waitFor(() => {
      expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    });
  });

  it('should not fetch when data is fresh', () => {
    // Input: Authenticated user + fresh cached data
    useAuthStore.setState({ user: createMockUser() });
    useTrackersStore.setState({
      myTrackers: [createMockTracker()],
      myTrackersLastFetched: Date.now() - 10000, // 10 seconds ago
      myTrackersRequestInFlight: null,
    });

    // Act: Render hook
    renderHook(() => useMyTrackers());

    // Output: Should not trigger fetch
    expect(mockTrackerApi.getMyTrackers).not.toHaveBeenCalled();
  });

  it('should fetch when data is stale', async () => {
    // Input: Authenticated user + stale cached data
    const mockTrackers = [createMockTracker()];
    mockTrackerApi.getMyTrackers.mockResolvedValue(mockTrackers);
    useAuthStore.setState({ user: createMockUser() });
    useTrackersStore.setState({
      myTrackers: [createMockTracker({ id: 'old', username: 'old' })],
      myTrackersLastFetched: Date.now() - 40000, // 40 seconds ago
      myTrackersRequestInFlight: null,
    });

    // Act: Render hook
    renderHook(() => useMyTrackers());

    // Output: Should trigger fetch
    await waitFor(() => {
      expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    });
  });

  it('should not trigger fetch when another request is already in progress', () => {
    // Input: Request already in flight
    const inFlightPromise = Promise.resolve();
    useAuthStore.setState({ user: createMockUser() });
    useTrackersStore.setState({
      myTrackers: [],
      myTrackersLastFetched: null,
      myTrackersRequestInFlight: inFlightPromise,
    });

    // Act: Render hook
    renderHook(() => useMyTrackers());

    // Output: Should not trigger another fetch
    expect(mockTrackerApi.getMyTrackers).not.toHaveBeenCalled();
  });

  it('should return trackers, loading state, and error from store', () => {
    // Input: Store has trackers, loading, and error state
    useAuthStore.setState({ user: createMockUser() });
    useTrackersStore.setState({
      myTrackers: [createMockTracker()],
      loading: true,
      error: 'Some error',
      myTrackersLastFetched: Date.now() - 10000,
      myTrackersRequestInFlight: null,
    });

    // Act: Render hook
    const { result } = renderHook(() => useMyTrackers());

    // Output: Should return store values
    expect(result.current.myTrackers).toHaveLength(1);
    expect(result.current.myTrackers[0].id).toBe('1');
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Some error');
  });

  it('should only trigger one fetch when multiple hook instances mount simultaneously', async () => {
    // Input: Multiple hook instances mounting at the same time
    const mockTrackers = [createMockTracker()];
    mockTrackerApi.getMyTrackers.mockResolvedValue(mockTrackers);
    useAuthStore.setState({ user: createMockUser() });
    useTrackersStore.setState({
      myTrackers: [],
      myTrackersLastFetched: null,
      myTrackersRequestInFlight: null,
    });

    // Act: Render multiple hook instances simultaneously
    renderHook(() => useMyTrackers());
    renderHook(() => useMyTrackers());
    renderHook(() => useMyTrackers());

    // Output: Only one API call should be made (store handles deduplication)
    await waitFor(() => {
      expect(mockTrackerApi.getMyTrackers).toHaveBeenCalledTimes(1);
    });
  });
});
