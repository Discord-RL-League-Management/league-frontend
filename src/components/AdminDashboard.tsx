import { useEffect, useState } from 'react';
import { ErrorDisplay } from '@/components/error-display';
import { useMembersStore } from '@/stores/membersStore';
import { useChannelsStore } from '@/stores/channelsStore';
import { guildApi } from '@/lib/api/guilds';
import { MetricsDrawer } from './admin-dashboard/MetricsDrawer';
import { DrawerTrigger } from './admin-dashboard/DrawerTrigger';

interface AdminDashboardProps {
  guildId: string;
}

/**
 * AdminDashboard - Single responsibility: Display administrative observability for a guild
 * Shows guild-wide metrics and system observability
 * Admin-only view with consistent data for all admins
 */
export default function AdminDashboard({ guildId }: AdminDashboardProps) {
  const [membersError, setMembersError] = useState<string | null>(null);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [memberStats, setMemberStats] = useState<{
    totalMembers: number;
    activeMembers: number;
    newThisWeek: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Members store
  const fetchMembers = useMembersStore((state) => state.fetchMembers);
  const getMembers = useMembersStore((state) => state.getMembers);
  const membersLoading = useMembersStore((state) => state.loading);
  const membersStoreError = useMembersStore((state) => state.error);

  // Channels store
  const fetchChannels = useChannelsStore((state) => state.fetchChannels);
  const getChannels = useChannelsStore((state) => state.getChannels);
  const channelsLoading = useChannelsStore((state) => state.loading);
  const channelsStoreError = useChannelsStore((state) => state.error);

  // Fetch member statistics
  useEffect(() => {
    const loadMemberStats = async () => {
      try {
        setLoadingStats(true);
        const stats = await guildApi.getMemberStats(guildId);
        setMemberStats(stats);
      } catch (err) {
        setMembersError(err instanceof Error ? err.message : 'Failed to load member statistics');
      } finally {
        setLoadingStats(false);
      }
    };

    loadMemberStats();
  }, [guildId]);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if we already have cached data with pagination info
        const existingData = getMembers(guildId, 1, 20);
        if (!existingData) {
          // Fetch first page of members to get total count (using default limit 20)
          await fetchMembers(guildId, 1, 20);
        }
      } catch (err) {
        setMembersError(err instanceof Error ? err.message : 'Failed to load members');
      }
    };

    loadData();
  }, [guildId, fetchMembers, getMembers]);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        await fetchChannels(guildId);
      } catch (err) {
        setChannelsError(err instanceof Error ? err.message : 'Failed to load channels');
      }
    };

    loadChannels();
  }, [guildId, fetchChannels]);

  // Get cached data
  const membersData = getMembers(guildId, 1, 20);
  const channels = getChannels(guildId);

  // Calculate metrics
  let totalMembers = membersData?.pagination?.total ?? null;
  if (!totalMembers && memberStats) {
    totalMembers = memberStats.totalMembers;
  }
  if (!totalMembers) {
    // Try to find any cached entry for this guild to get pagination.total
    const guildCache = useMembersStore.getState().cache[guildId];
    if (guildCache) {
      const firstEntry = guildCache.values().next().value;
      if (firstEntry?.pagination?.total) {
        totalMembers = firstEntry.pagination.total;
      }
    }
  }
  const totalChannels = channels.length;

  // Determine loading state
  const isLoadingMembers = (membersLoading || loadingStats) && totalMembers === null;
  const isLoadingChannels = channelsLoading && totalChannels === 0 && !channelsError;

  // Determine error state
  const hasMembersError = membersStoreError || membersError;
  const hasChannelsError = channelsStoreError || channelsError;

  // Calculate channel types (if type property exists)
  const textChannels = channels.filter(ch => 'type' in ch && (ch.type === 0 || ch.type === 5)).length;
  const voiceChannels = channels.filter(ch => 'type' in ch && (ch.type === 2 || ch.type === 13)).length;
  const channelDescription = textChannels > 0 || voiceChannels > 0 
    ? `${textChannels} text, ${voiceChannels} voice`
    : 'Server channels';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <DrawerTrigger onClick={() => setDrawerOpen(true)} />
      </div>

      {/* Error displays */}
      {hasMembersError && (
        <ErrorDisplay 
          error={hasMembersError} 
          onRetry={() => {
            setMembersError(null);
            fetchMembers(guildId, 1, 20);
          }}
        />
      )}
      {hasChannelsError && (
        <ErrorDisplay 
          error={hasChannelsError} 
          onRetry={() => {
            setChannelsError(null);
            fetchChannels(guildId);
          }}
        />
      )}

      {/* Metrics Drawer */}
      <MetricsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        totalMembers={totalMembers}
        activeMembers={memberStats?.activeMembers ?? null}
        newThisWeek={memberStats?.newThisWeek ?? null}
        totalChannels={totalChannels}
        channelDescription={channelDescription}
        isLoadingMembers={isLoadingMembers}
        isLoadingChannels={isLoadingChannels}
        hasMembersError={hasMembersError}
        hasChannelsError={hasChannelsError}
      />
    </div>
  );
}

