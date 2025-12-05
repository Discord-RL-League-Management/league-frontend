import { useEffect, useState, useMemo, useRef } from 'react';
import { guildApi } from '@/lib/api/guilds.js';
import { shouldIgnoreError, createAbortCleanup } from './useAbortableFetch.js';
import type { DiscordRole } from '@/types/discord.js';
import type { Member } from '@/stores/membersStore.js';

/**
 * useGuildMemberData Hook
 * 
 * Encapsulates guild member and roles API calls with loading, error, and abort state management.
 * This hook moves data fetching logic from the Presentation layer to the Application layer,
 * maintaining proper architectural separation.
 * 
 * @param guildId - The guild ID to fetch member data for
 * @param userId - The user ID to fetch membership for
 * @returns { membership, roles, loading, roleNameMap, userRoles } - Member data, roles, loading state, role name map, and user roles
 */
export function useGuildMemberData(guildId: string, userId: string | undefined) {
  const [membership, setMembership] = useState<Member | null>(null);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [rolesLoading] = useState(false);
  const membershipCancelledRef = useRef(false);
  const rolesCancelledRef = useRef(false);

  useEffect(() => {
    if (!userId || !guildId) {
      setMembership(null);
      return;
    }

    const abortController = new AbortController();
    membershipCancelledRef.current = false;

    const fetchMembership = async () => {
      setMembershipLoading(true);
      try {
        const memberData = await guildApi.getGuildMember(guildId, userId, {
          signal: abortController.signal,
        }) as Member;

        if (!membershipCancelledRef.current && !abortController.signal.aborted) {
          setMembership(memberData);
        }
      } catch (err: unknown) {
        if (shouldIgnoreError(err, abortController.signal, membershipCancelledRef.current)) {
          return;
        }

        console.error('Error fetching user membership:', err);
        if (!membershipCancelledRef.current && !abortController.signal.aborted) {
          setMembership(null);
        }
      } finally {
        if (!membershipCancelledRef.current && !abortController.signal.aborted) {
          setMembershipLoading(false);
        }
      }
    };

    fetchMembership();

    return createAbortCleanup(abortController, membershipCancelledRef);
  }, [guildId, userId]);

  useEffect(() => {
    if (!guildId) {
      setRoles([]);
      return;
    }

    const abortController = new AbortController();
    rolesCancelledRef.current = false;

    const fetchRoles = async () => {
      try {
        const rolesData = await guildApi.getGuildRoles(guildId, {
          signal: abortController.signal,
        });

        if (!rolesCancelledRef.current && !abortController.signal.aborted) {
          setRoles(rolesData);
        }
      } catch (err: unknown) {
        if (shouldIgnoreError(err, abortController.signal, rolesCancelledRef.current)) {
          return;
        }

        const errorObj = err as { response?: { status?: number }; status?: number };
        // Handle 403 (non-admins can't fetch roles) gracefully
        if (errorObj.response?.status === 403 || errorObj.status === 403) {
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
  }, [guildId]);

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

