import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useGuildStore } from '../guildStore';
import * as guildApiModule from '../../lib/api/guilds';
import type { Guild } from '../../types/guild';

// Mock the guild API
jest.mock('../../lib/api/guilds', () => ({
  guildApi: {
    getMyGuilds: jest.fn(),
  },
}));

const mockGuildApi = guildApiModule.guildApi as jest.Mocked<typeof guildApiModule.guildApi>;

// Helper to create mock guild
const createMockGuild = (overrides?: Partial<Guild>): Guild => ({
  id: '123456789',
  name: 'Test Guild',
  icon: 'test_icon',
  roles: ['role1', 'role2'],
  ...overrides,
});

describe('guildStore.fetchGuilds', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGuildStore.setState({
      guilds: [],
      lastFetched: null,
      loading: false,
      error: null,
      pendingRequest: null,
    });
    jest.clearAllMocks();
  });

  it('should handle 429 rate limit errors without retrying', async () => {
    // Input: API returns 429 error
    const rateLimitError = {
      status: 429,
      response: { status: 429, data: { message: 'Too Many Requests' } },
    };
    mockGuildApi.getMyGuilds.mockRejectedValue(rateLimitError);

    // Act: Request guilds
    await expect(
      useGuildStore.getState().fetchGuilds()
    ).rejects.toEqual(rateLimitError);

    // Output (State Verification): Error message should be set
    const state = useGuildStore.getState();
    expect(state.error).toBe('Too many requests. Please wait a moment before trying again.');
    expect(state.loading).toBe(false);
    expect(state.pendingRequest).toBeNull();
  });

  it('should only make one API call when multiple fetchGuilds calls happen simultaneously', async () => {
    // Input: Multiple simultaneous calls (simulating race condition)
    const mockGuilds = [createMockGuild()];
    
    // Simulate slow API response to allow multiple calls before first completes
    // This creates a window where race conditions can occur
    let resolveApiCall: (value: Guild[]) => void;
    const delayedApiCall = new Promise<Guild[]>((resolve) => {
      resolveApiCall = resolve;
    });
    mockGuildApi.getMyGuilds.mockReturnValue(delayedApiCall);

    // Act: Call fetchGuilds multiple times in rapid succession (simulating race condition)
    // These calls happen before the first API call completes
    const promise1 = useGuildStore.getState().fetchGuilds();
    const promise2 = useGuildStore.getState().fetchGuilds();
    const promise3 = useGuildStore.getState().fetchGuilds();
    const promise4 = useGuildStore.getState().fetchGuilds();
    const promise5 = useGuildStore.getState().fetchGuilds();

    // Verify flag was set synchronously (before API call completes)
    const stateDuringCall = useGuildStore.getState();
    expect(stateDuringCall.pendingRequest).not.toBeNull();

    // Resolve the API call
    resolveApiCall!(mockGuilds);
    
    // Wait for all promises to resolve
    await Promise.all([promise1, promise2, promise3, promise4, promise5]);

    // Output (State Verification): Only one API call should be made, despite 5 simultaneous calls
    // Boundary Behavior Verification Exception: This verifies contract at external API boundary
    expect(mockGuildApi.getMyGuilds).toHaveBeenCalledTimes(1);
    
    // Output (State Verification): All calls should resolve successfully with the same data
    const finalState = useGuildStore.getState();
    expect(finalState.guilds).toEqual(mockGuilds);
    expect(finalState.pendingRequest).toBeNull();
  });

  it('should not make API call when data is fresh', async () => {
    // Input: Fresh cached data (within 5-minute TTL)
    const mockGuilds = [createMockGuild()];
    
    useGuildStore.setState({
      guilds: mockGuilds,
      lastFetched: Date.now() - 60000, // 1 minute ago (fresh)
    });

    // Act: Request guilds
    await useGuildStore.getState().fetchGuilds();

    // Output (State Verification): No API call should be made
    expect(mockGuildApi.getMyGuilds).not.toHaveBeenCalled();
    
    // Output (State Verification): Data should remain unchanged
    const state = useGuildStore.getState();
    expect(state.guilds).toEqual(mockGuilds);
  });

  it('should fetch fresh data when cache is stale', async () => {
    // Input: Stale cached data (older than 5-minute TTL)
    const freshGuilds = [createMockGuild()];
    mockGuildApi.getMyGuilds.mockResolvedValue(freshGuilds);
    
    useGuildStore.setState({
      guilds: [createMockGuild({ id: 'old', name: 'Old Guild' })],
      lastFetched: Date.now() - 400000, // ~6.7 minutes ago (stale)
    });

    // Act: Request guilds
    await useGuildStore.getState().fetchGuilds();

    // Output (State Verification): API call should be made
    // Boundary Behavior Verification Exception: This verifies contract at external API boundary
    expect(mockGuildApi.getMyGuilds).toHaveBeenCalledTimes(1);
    
    // Output (State Verification): Store state updated with fresh data
    const state = useGuildStore.getState();
    expect(state.guilds).toEqual(freshGuilds);
    // Output (State Verification): lastFetched updated to current timestamp
    expect(state.lastFetched).toBeGreaterThan(Date.now() - 1000); // Within last second
  });

  it('should fetch fresh data when force flag is true, even with fresh cache', async () => {
    // Input: Fresh cached data + force flag
    const freshGuilds = [createMockGuild()];
    mockGuildApi.getMyGuilds.mockResolvedValue(freshGuilds);
    
    useGuildStore.setState({
      guilds: [createMockGuild({ id: 'old', name: 'Old Guild' })],
      lastFetched: Date.now() - 60000, // 1 minute ago (fresh)
    });

    // Act: Request guilds with force flag
    await useGuildStore.getState().fetchGuilds(true);

    // Output (State Verification): API call should be made despite fresh cache
    // Boundary Behavior Verification Exception: This verifies contract at external API boundary
    expect(mockGuildApi.getMyGuilds).toHaveBeenCalledTimes(1);
    
    // Output (State Verification): Store state updated with fresh data
    const state = useGuildStore.getState();
    expect(state.guilds).toEqual(freshGuilds);
  });

  it('should fetch when guilds array is empty', async () => {
    // Input: No cached guilds (guilds.length === 0)
    const mockGuilds = [createMockGuild()];
    mockGuildApi.getMyGuilds.mockResolvedValue(mockGuilds);
    
    useGuildStore.setState({
      guilds: [],
      lastFetched: null,
    });

    // Act: Request guilds
    await useGuildStore.getState().fetchGuilds();

    // Output (State Verification): API call should be made
    // Boundary Behavior Verification Exception: This verifies contract at external API boundary
    expect(mockGuildApi.getMyGuilds).toHaveBeenCalledTimes(1);
    
    // Output (State Verification): Store populated with fetched guilds
    const state = useGuildStore.getState();
    expect(state.guilds).toEqual(mockGuilds);
  });

  it('should prevent duplicate requests when calls happen in rapid succession', async () => {
    // Input: Simulating multiple rapid calls before any completes
    const mockGuilds = [createMockGuild()];
    let resolveApiCall: (value: Guild[]) => void;
    const delayedPromise = new Promise<Guild[]>((resolve) => {
      resolveApiCall = resolve;
    });
    mockGuildApi.getMyGuilds.mockReturnValue(delayedPromise);

    // Act: Start first request
    const firstPromise = useGuildStore.getState().fetchGuilds();
    
    // Verify flag is set immediately (synchronously) - this prevents race conditions
    const stateAfterFirst = useGuildStore.getState();
    expect(stateAfterFirst.pendingRequest).not.toBeNull();
    
    // Act: Start second request immediately after (simulating race condition)
    const secondPromise = useGuildStore.getState().fetchGuilds();
    
    // Act: Start third request (simulating multiple components mounting)
    const thirdPromise = useGuildStore.getState().fetchGuilds();

    // Verify flag is still set (all calls should see the same in-flight request)
    const stateAfterMultiple = useGuildStore.getState();
    expect(stateAfterMultiple.pendingRequest).not.toBeNull();

    // Resolve the API call
    resolveApiCall!(mockGuilds);
    await Promise.all([firstPromise, secondPromise, thirdPromise]);

    // Output (State Verification): Only one API call should be made
    // Boundary Behavior Verification Exception: This verifies contract at external API boundary
    expect(mockGuildApi.getMyGuilds).toHaveBeenCalledTimes(1);
    
    // Output (State Verification): All promises should resolve successfully with same data
    const finalState = useGuildStore.getState();
    expect(finalState.guilds).toEqual(mockGuilds);
    expect(finalState.pendingRequest).toBeNull();
  });
});

