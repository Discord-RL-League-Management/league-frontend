import { useEffect, useState, useMemo, useRef } from 'react';
import { guildApi } from '@/lib/api/guilds.js';
import { shouldIgnoreError, createAbortCleanup } from './useAbortableFetch.js';
import type { DiscordRole } from '@/types/discord.js';
import type { Member } from '@/stores/membersStore.js';

// Module-level cache to prevent duplicate fetches across component instances
const membershipCache = new Map<string, { data: Member | null; timestamp: number }>();
const rolesCache = new Map<string, { data: DiscordRole[]; timestamp: number }>();
const membershipFetchPromises = new Map<string, Promise<Member>>();
const rolesFetchPromises = new Map<string, Promise<DiscordRole[]>>();
const MEMBERSHIP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const ROLES_CACHE_TTL = 10 * 60 * 1000; // 10 minutes (roles change less frequently)

/**
 * Reset module-level cache (for testing purposes)
 * @internal
 */
export function __resetCache() {
  membershipCache.clear();
  rolesCache.clear();
  membershipFetchPromises.clear();
  rolesFetchPromises.clear();
}

/**
 * useGuildMemberData Hook
 * 
 * Encapsulates guild member and roles API calls with loading, error, and abort state management.
 * Includes caching to prevent duplicate fetches across component instances.
 * 
 * @param guildId - The guild ID to fetch member data for
 * @param userId - The user ID to fetch membership for
 * @returns { membership, roles, loading, roleNameMap, userRoles } - Member data, roles, loading state, role name map, and user roles
 */
export function useGuildMemberData(guildId: string, userId: string | undefined) {
  const membershipKey = `${guildId}-${userId}`;
  const rolesKey = guildId;
  
  const cachedMembership = membershipCache.get(membershipKey);
  const cachedRoles = rolesCache.get(rolesKey);
  
  const [membership, setMembership] = useState<Member | null>(cachedMembership?.data ?? null);
  const [roles, setRoles] = useState<DiscordRole[]>(cachedRoles?.data ?? []);
  const [membershipLoading, setMembershipLoading] = useState(!cachedMembership);
  const [rolesLoading] = useState(false);
  const membershipCancelledRef = useRef(false);
  const rolesCancelledRef = useRef(false);

  useEffect(() => {
    if (!userId || !guildId) {
      setMembership(null);
      return;
    }

    const now = Date.now();
    const cached = membershipCache.get(membershipKey);
    if (cached && (now - cached.timestamp < MEMBERSHIP_CACHE_TTL)) {
      setMembership(cached.data);
      setMembershipLoading(false);
      return;
    }

    const existingPromise = membershipFetchPromises.get(membershipKey);
    if (existingPromise) {
      existingPromise
        .then((data) => {
          if (!membershipCancelledRef.current) {
            setMembership(data);
          }
          setMembershipLoading(false);
        })
        .catch(() => {
          // Silently ignore - errors handled in main fetch flow
          setMembershipLoading(false);
        });
      return;
    }

    const abortController = new AbortController();
    membershipCancelledRef.current = false;

    const fetchMembership = async () => {
      setMembershipLoading(true);
      try {
        const fetchPromise = guildApi.getGuildMember(guildId, userId, {
          signal: abortController.signal,
        }) as Promise<Member>;
        membershipFetchPromises.set(membershipKey, fetchPromise);

        const memberData = await fetchPromise;

        membershipCache.set(membershipKey, { data: memberData, timestamp: Date.now() });
        membershipFetchPromises.delete(membershipKey);

        if (!membershipCancelledRef.current && !abortController.signal.aborted) {
          setMembership(memberData);
        }
      } catch (err: unknown) {
        membershipFetchPromises.delete(membershipKey);
        if (shouldIgnoreError(err, abortController.signal, membershipCancelledRef.current)) {
          return;
        }

        console.error('Error fetching user membership:', err);
        if (!membershipCancelledRef.current && !abortController.signal.aborted) {
          setMembership(null);
        }
      } finally {
        setMembershipLoading(false);
      }
    };

    fetchMembership();

    return createAbortCleanup(abortController, membershipCancelledRef);
  }, [guildId, userId, membershipKey]);

  useEffect(() => {
    if (!guildId) {
      setRoles([]);
      return;
    }

    const now = Date.now();
    const cached = rolesCache.get(rolesKey);
    if (cached && (now - cached.timestamp < ROLES_CACHE_TTL)) {
      setRoles(cached.data);
      return;
    }

    const existingPromise = rolesFetchPromises.get(rolesKey);
    if (existingPromise) {
      existingPromise
        .then((data) => {
          if (!rolesCancelledRef.current) {
            setRoles(data);
          }
        })
        .catch(() => {
          // Silently ignore - errors handled in main fetch flow
        });
      return;
    }

    const abortController = new AbortController();
    rolesCancelledRef.current = false;

    const fetchRoles = async () => {
      try {
        const fetchPromise = guildApi.getGuildRoles(guildId, {
          signal: abortController.signal,
        });
        rolesFetchPromises.set(rolesKey, fetchPromise);

        const rolesData = await fetchPromise;

        rolesCache.set(rolesKey, { data: rolesData, timestamp: Date.now() });
        rolesFetchPromises.delete(rolesKey);

        if (!rolesCancelledRef.current && !abortController.signal.aborted) {
          setRoles(rolesData);
        }
      } catch (err: unknown) {
        rolesFetchPromises.delete(rolesKey);
        if (shouldIgnoreError(err, abortController.signal, rolesCancelledRef.current)) {
          return;
        }

        const errorObj = err as { response?: { status?: number }; status?: number };
        // Non-admins cannot fetch roles (403), so cache empty result to prevent repeated failed requests
        if (errorObj.response?.status === 403 || errorObj.status === 403) {
          rolesCache.set(rolesKey, { data: [], timestamp: Date.now() });
          if (!rolesCancelledRef.current && !abortController.signal.aborted) {
            setRoles([]);
          }
        } else {
          console.error('Failed to fetch guild roles:', err);
        }
      }
    };

    fetchRoles();

    return createAbortCleanup(abortController, rolesCancelledRef);
  }, [guildId, rolesKey]);

  const roleNameMap = useMemo(() => {
    const map = new Map<string, string>();
    roles.forEach(role => {
      map.set(role.id, role.name);
    });
    return map;
  }, [roles]);

  const userRoles = Array.isArray(membership?.roles) ? membership.roles : [];

  const loading = membershipLoading || rolesLoading;

  return {
    membership,
    roles,
    userRoles,
    roleNameMap,
    loading,
  };
}

