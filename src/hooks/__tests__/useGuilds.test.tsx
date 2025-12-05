import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import type { Guild } from '../../types/guild';
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

// Mock the guild API
jest.mock('../../lib/api/guilds', () => ({
  guildApi: {
    getMyGuilds: jest.fn(),
  },
}));

// Import after mocks
import { useGuilds } from '../useGuilds';
import { useAuthStore } from '../../stores/index';
import { useGuildStore } from '../../stores/guildStore';
import { guildApi } from '../../lib/api/guilds';

const mockGuildApi = guildApi as jest.Mocked<typeof guildApi>;

// Helper to create mock guild
const createMockGuild = (overrides?: Partial<Guild>): Guild => ({
  id: '123456789',
  name: 'Test Guild',
  icon: 'test_icon',
  roles: ['role1', 'role2'],
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

describe('useGuilds hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset stores to default state
    useAuthStore.setState({ user: null });
    useGuildStore.setState({
      guilds: [],
      loading: false,
      error: null,
      lastFetched: null,
      pendingRequest: null,
    });
  });

  it('should not fetch when user is not authenticated', () => {
    // Input: No authenticated user
    useAuthStore.setState({ user: null });
    
    // Act: Render hook
    renderHook(() => useGuilds());

    // Output (State Verification): Should not trigger fetch
    expect(mockGuildApi.getMyGuilds).not.toHaveBeenCalled();
  });

  it('should fetch when user is authenticated and data is empty', async () => {
    // Input: Authenticated user + empty guilds
    const mockGuilds = [createMockGuild()];
    mockGuildApi.getMyGuilds.mockResolvedValue(mockGuilds);
    useAuthStore.setState({ user: createMockUser() });
    
    // Act: Render hook
    renderHook(() => useGuilds());

    // Output (State Verification): Should trigger fetch
    await waitFor(() => {
      expect(mockGuildApi.getMyGuilds).toHaveBeenCalledTimes(1);
    });
  });

  it('should not fetch when data is fresh', () => {
    // Input: Authenticated user + fresh cached data (< 5 minutes)
    useAuthStore.setState({ user: createMockUser() });
    useGuildStore.setState({
      guilds: [createMockGuild()],
      lastFetched: Date.now() - 60000, // 1 minute ago (fresh)
      pendingRequest: null,
    });

    // Act: Render hook
    renderHook(() => useGuilds());

    // Output (State Verification): Should not trigger fetch
    expect(mockGuildApi.getMyGuilds).not.toHaveBeenCalled();
  });

  it('should fetch when data is stale', async () => {
    // Input: Authenticated user + stale cached data (> 5 minutes)
    const mockGuilds = [createMockGuild()];
    mockGuildApi.getMyGuilds.mockResolvedValue(mockGuilds);
    useAuthStore.setState({ user: createMockUser() });
    useGuildStore.setState({
      guilds: [createMockGuild({ id: 'old', name: 'Old Guild' })],
      lastFetched: Date.now() - 400000, // ~6.7 minutes ago (stale)
      pendingRequest: null,
    });

    // Act: Render hook
    renderHook(() => useGuilds());

    // Output (State Verification): Should trigger fetch
    await waitFor(() => {
      expect(mockGuildApi.getMyGuilds).toHaveBeenCalledTimes(1);
    });
  });
});

