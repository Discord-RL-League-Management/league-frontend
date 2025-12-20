import { useEffect, useState } from 'react';
import { guildApi } from '@/lib/api/guilds.js';

// Module-level cache for member stats to prevent duplicate fetches
const memberStatsCache = new Map<string, { data: { totalMembers: number; activeMembers: number; newThisWeek: number }; timestamp: number }>();
const memberStatsFetchPromises = new Map<string, Promise<{ totalMembers: number; activeMembers: number; newThisWeek: number }>>();
const MEMBER_STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  newThisWeek: number;
}

/**
 * useMemberStats - Custom hook for fetching and caching member statistics
 * Handles caching, deduplication of in-flight requests, and error handling
 */
export function useMemberStats(guildId: string) {
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMemberStats = async () => {
      const cached = memberStatsCache.get(guildId);
      const now = Date.now();
      if (cached && (now - cached.timestamp < MEMBER_STATS_CACHE_TTL)) {
        setMemberStats(cached.data);
        setLoading(false);
        return;
      }

      const existingPromise = memberStatsFetchPromises.get(guildId);
      if (existingPromise) {
        try {
          const stats = await existingPromise;
          setMemberStats(stats);
          setLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load member statistics');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const fetchPromise = guildApi.getMemberStats(guildId);
        memberStatsFetchPromises.set(guildId, fetchPromise);
        
        const stats = await fetchPromise;
        
        memberStatsCache.set(guildId, { data: stats, timestamp: Date.now() });
        memberStatsFetchPromises.delete(guildId);
        
        setMemberStats(stats);
      } catch (err) {
        memberStatsFetchPromises.delete(guildId);
        setError(err instanceof Error ? err.message : 'Failed to load member statistics');
      } finally {
        setLoading(false);
      }
    };

    loadMemberStats();
  }, [guildId]);

  return { memberStats, loading, error };
}

