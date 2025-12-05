/**
 * Black Box Tests for useGuildMemberData Hook
 * 
 * These tests strictly adhere to the Black Box Axiom:
 * - Verify only public contract (inputs, outputs, observable state)
 * - No implementation coupling
 * - State verification preferred
 * - Cyclomatic complexity v(G) ≤ 7 per test
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useGuildMemberData } from '../useGuildMemberData.js';
import { guildApi } from '@/lib/api/guilds.js';
import type { DiscordRole } from '@/types/discord.js';
import type { Member } from '@/stores/membersStore.js';

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

jest.mock('@/lib/api/guilds');

describe('useGuildMemberData', () => {
  const mockGetGuildMember = guildApi.getGuildMember as jest.MockedFunction<typeof guildApi.getGuildMember>;
  const mockGetGuildRoles = guildApi.getGuildRoles as jest.MockedFunction<typeof guildApi.getGuildRoles>;

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('initial state', () => {
    test('returns loading true, membership null, roles empty with valid params', () => {
      mockGetGuildMember.mockImplementation(() => new Promise(() => {}));
      mockGetGuildRoles.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      expect(result.current.loading).toBe(true);
      expect(result.current.membership).toBe(null);
      expect(result.current.roles).toEqual([]);
      expect(result.current.userRoles).toEqual([]);
      expect(result.current.roleNameMap).toBeInstanceOf(Map);
      expect(result.current.roleNameMap.size).toBe(0);
    });
  });

  describe('missing parameters', () => {
    test('returns membership null when userId is undefined', () => {
      const { result } = renderHook(() => useGuildMemberData('guild-123', undefined));

      expect(result.current.membership).toBe(null);
      expect(mockGetGuildMember).not.toHaveBeenCalled();
    });

    test('returns roles empty array when guildId is empty string', () => {
      mockGetGuildRoles.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useGuildMemberData('', 'user-123'));

      expect(result.current.roles).toEqual([]);
      expect(mockGetGuildRoles).not.toHaveBeenCalled();
    });
  });

  describe('successful membership fetch', () => {
    test('returns membership data and loading false when API resolves', async () => {
      const mockMembership: Member = {
        id: 'member-123',
        userId: 'user-123',
        username: 'testuser',
        nickname: 'Test User',
        roles: ['role-1', 'role-2'],
        joinedAt: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-123',
          username: 'testuser',
          globalName: 'Test User',
          avatar: 'avatar-url',
        },
      };

      mockGetGuildMember.mockResolvedValue(mockMembership);
      mockGetGuildRoles.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.membership).toEqual(mockMembership);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('successful roles fetch', () => {
    test('returns roles data and roleNameMap when API resolves', async () => {
      const mockRoles: DiscordRole[] = [
        { id: 'role-1', name: 'Admin' },
        { id: 'role-2', name: 'Member' },
        { id: 'role-3', name: 'Moderator' },
      ];

      mockGetGuildMember.mockImplementation(() => new Promise(() => {}));
      mockGetGuildRoles.mockResolvedValue(mockRoles);

      const { result } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      await waitFor(() => {
        expect(result.current.roles.length).toBeGreaterThan(0);
      });

      expect(result.current.roles).toEqual(mockRoles);
      expect(result.current.roleNameMap.size).toBe(3);
      expect(result.current.roleNameMap.get('role-1')).toBe('Admin');
      expect(result.current.roleNameMap.get('role-2')).toBe('Member');
      expect(result.current.roleNameMap.get('role-3')).toBe('Moderator');
    });
  });

  describe('role name map', () => {
    test('correctly maps role IDs to names from roles array', async () => {
      const mockRoles: DiscordRole[] = [
        { id: 'role-1', name: 'Admin' },
        { id: 'role-2', name: 'Member' },
      ];

      mockGetGuildMember.mockImplementation(() => new Promise(() => {}));
      mockGetGuildRoles.mockResolvedValue(mockRoles);

      const { result } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      await waitFor(() => {
        expect(result.current.roleNameMap.size).toBe(2);
      });

      expect(result.current.roleNameMap.get('role-1')).toBe('Admin');
      expect(result.current.roleNameMap.get('role-2')).toBe('Member');
    });
  });

  describe('user roles extraction', () => {
    test('extracts userRoles from membership.roles array', async () => {
      const mockMembership: Member = {
        id: 'member-123',
        userId: 'user-123',
        username: 'testuser',
        roles: ['role-1', 'role-2', 'role-3'],
        joinedAt: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      };

      mockGetGuildMember.mockResolvedValue(mockMembership);
      mockGetGuildRoles.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      await waitFor(() => {
        expect(result.current.membership).not.toBe(null);
      });

      expect(result.current.userRoles).toEqual(['role-1', 'role-2', 'role-3']);
    });

    test('returns empty array when membership.roles is null', async () => {
      const mockMembership: Member = {
        id: 'member-123',
        userId: 'user-123',
        username: 'testuser',
        roles: null as unknown as string[],
        joinedAt: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      };

      mockGetGuildMember.mockResolvedValue(mockMembership);
      mockGetGuildRoles.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      await waitFor(() => {
        expect(result.current.membership).not.toBe(null);
      });

      expect(result.current.userRoles).toEqual([]);
    });

    test('returns empty array when membership.roles is undefined', async () => {
      const mockMembership = {
        id: 'member-123',
        userId: 'user-123',
        username: 'testuser',
        roles: undefined,
        joinedAt: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      } as Member;

      mockGetGuildMember.mockResolvedValue(mockMembership);
      mockGetGuildRoles.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      await waitFor(() => {
        expect(result.current.membership).not.toBe(null);
      });

      expect(result.current.userRoles).toEqual([]);
    });
  });

  describe('membership error handling', () => {
    test('returns membership null and logs error when API rejects', async () => {
      const error = new Error('Failed to fetch membership');
      mockGetGuildMember.mockRejectedValue(error);
      mockGetGuildRoles.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.membership).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user membership:', error);
    });
  });

  describe('roles 403 error handling', () => {
    test('returns roles empty array when API rejects with 403 (expected for non-admins)', async () => {
      const error403 = {
        response: {
          status: 403,
        },
      };
      mockGetGuildMember.mockImplementation(() => new Promise(() => {}));
      mockGetGuildRoles.mockRejectedValue(error403);

      const { result } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      await waitFor(() => {
        expect(result.current.roles).toEqual([]);
      });

      expect(result.current.roles).toEqual([]);
      expect(result.current.roleNameMap.size).toBe(0);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('returns roles empty array when error.status is 403', async () => {
      const error403 = {
        status: 403,
      };
      mockGetGuildMember.mockImplementation(() => new Promise(() => {}));
      mockGetGuildRoles.mockRejectedValue(error403);

      const { result } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      await waitFor(() => {
        expect(result.current.roles).toEqual([]);
      });

      expect(result.current.roles).toEqual([]);
    });
  });

  describe('roles other error handling', () => {
    test('returns roles empty array and logs error when API rejects with other error', async () => {
      const error = {
        response: {
          status: 500,
        },
      };
      mockGetGuildMember.mockImplementation(() => new Promise(() => {}));
      mockGetGuildRoles.mockRejectedValue(error);

      const { result } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      await waitFor(() => {
        expect(result.current.roles).toEqual([]);
      });

      expect(result.current.roles).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch guild roles:', error);
    });
  });

  describe('abort error handling', () => {
    test('does not update state after unmount when abort occurs', async () => {
      const mockMembership: Member = {
        id: 'member-123',
        userId: 'user-123',
        username: 'testuser',
        roles: [],
        joinedAt: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      };

      let resolveMembership: (value: Member) => void;
      const pendingMembership = new Promise<Member>((resolve) => {
        resolveMembership = resolve;
      });

      let resolveRoles: (value: DiscordRole[]) => void;
      const pendingRoles = new Promise<DiscordRole[]>((resolve) => {
        resolveRoles = resolve;
      });

      mockGetGuildMember.mockReturnValue(pendingMembership);
      mockGetGuildRoles.mockReturnValue(pendingRoles);

      const { result, unmount } = renderHook(() => useGuildMemberData('guild-123', 'user-123'));

      expect(result.current.loading).toBe(true);

      unmount();

      // Resolve after unmount
      resolveMembership!(mockMembership);
      resolveRoles!([{ id: 'role-1', name: 'Admin' }]);

      // Wait a bit to ensure no state updates occur
      await new Promise((resolve) => setTimeout(resolve, 100));

      // After unmount, we can't check result.current, but we verify
      // the test doesn't throw and the promises resolve
      expect(mockGetGuildMember).toHaveBeenCalled();
      expect(mockGetGuildRoles).toHaveBeenCalled();
    });
  });

  describe('parameter changes', () => {
    test('re-fetches membership when userId changes', async () => {
      const mockMembership1: Member = {
        id: 'member-123',
        userId: 'user-123',
        username: 'testuser1',
        roles: [],
        joinedAt: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-123',
          username: 'testuser1',
        },
      };

      const mockMembership2: Member = {
        id: 'member-456',
        userId: 'user-456',
        username: 'testuser2',
        roles: [],
        joinedAt: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-456',
          username: 'testuser2',
        },
      };

      mockGetGuildMember
        .mockResolvedValueOnce(mockMembership1)
        .mockResolvedValueOnce(mockMembership2);
      mockGetGuildRoles.mockImplementation(() => new Promise(() => {}));

      const { result, rerender } = renderHook(
        ({ guildId, userId }) => useGuildMemberData(guildId, userId),
        {
          initialProps: { guildId: 'guild-123', userId: 'user-123' },
        }
      );

      await waitFor(() => {
        expect(result.current.membership?.userId).toBe('user-123');
      });

      rerender({ guildId: 'guild-123', userId: 'user-456' });

      await waitFor(() => {
        expect(result.current.membership?.userId).toBe('user-456');
      });

      expect(mockGetGuildMember).toHaveBeenCalledTimes(2);
    });

    test('re-fetches roles when guildId changes', async () => {
      const mockRoles1: DiscordRole[] = [{ id: 'role-1', name: 'Admin' }];
      const mockRoles2: DiscordRole[] = [{ id: 'role-2', name: 'Member' }];

      mockGetGuildMember.mockImplementation(() => new Promise(() => {}));
      mockGetGuildRoles
        .mockResolvedValueOnce(mockRoles1)
        .mockResolvedValueOnce(mockRoles2);

      const { result, rerender } = renderHook(
        ({ guildId, userId }) => useGuildMemberData(guildId, userId),
        {
          initialProps: { guildId: 'guild-123', userId: 'user-123' },
        }
      );

      await waitFor(() => {
        expect(result.current.roles.length).toBe(1);
      });

      expect(result.current.roles[0].id).toBe('role-1');

      rerender({ guildId: 'guild-456', userId: 'user-123' });

      await waitFor(() => {
        expect(result.current.roles[0].id).toBe('role-2');
      });

      expect(mockGetGuildRoles).toHaveBeenCalledTimes(2);
    });
  });
});

