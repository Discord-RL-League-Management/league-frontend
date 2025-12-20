import { useEffect, useState } from 'react';
import { ErrorDisplay } from '@/components/error-display.js';
import { useMembersStore } from '@/stores/membersStore.js';
import { useChannelsStore } from '@/stores/channelsStore.js';
import { MetricsDrawer } from './admin-dashboard/MetricsDrawer.js';
import { DrawerTrigger } from './admin-dashboard/DrawerTrigger.js';
import { MetricCard } from './admin-dashboard/MetricCard.js';
import { useMemberStats } from '@/hooks/useMemberStats.js';
import { Users, UserPlus, Hash, Trophy } from 'lucide-react';

interface AdminDashboardProps {
  guildId: string;
}

/**
 * Helper function to calculate total members from various sources
 */
function calculateTotalMembers(
  membersData: { pagination?: { total?: number } } | null | undefined,
  memberStats: { totalMembers: number } | null,
  guildId: string
): number | null {
  let totalMembers = membersData?.pagination?.total ?? null;
  if (!totalMembers && memberStats) {
    totalMembers = memberStats.totalMembers;
  }
  if (!totalMembers) {
    const guildCache = useMembersStore.getState().cache[guildId];
    if (guildCache) {
      const firstEntry = guildCache.values().next().value;
      if (firstEntry?.pagination?.total) {
        totalMembers = firstEntry.pagination.total;
      }
    }
  }
  return totalMembers;
}

/**
 * AdminDashboard - Single responsibility: Display administrative observability for a guild
 * Shows guild-wide metrics and system observability
 * Admin-only view with consistent data for all admins
 */
export default function AdminDashboard({ guildId }: AdminDashboardProps) {
  const [membersError, setMembersError] = useState<string | null>(null);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchMembers = useMembersStore((state) => state.fetchMembers);
  const getMembers = useMembersStore((state) => state.getMembers);
  const membersLoading = useMembersStore((state) => state.loading);
  const membersStoreError = useMembersStore((state) => state.error);

  const fetchChannels = useChannelsStore((state) => state.fetchChannels);
  const getChannels = useChannelsStore((state) => state.getChannels);
  const channelsLoading = useChannelsStore((state) => state.loading);
  const channelsStoreError = useChannelsStore((state) => state.error);

  const { memberStats, loading: loadingStats } = useMemberStats(guildId);
  useEffect(() => {
    const loadData = async () => {
      try {
        const existingData = getMembers(guildId, 1, 20);
        if (!existingData) {
          await fetchMembers(guildId, 1, 20);
        }
      } catch (err) {
        setMembersError(err instanceof Error ? err.message : 'Failed to load members');
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        await fetchChannels(guildId);
      } catch (err) {
        setChannelsError(err instanceof Error ? err.message : 'Failed to load channels');
      }
    };

    loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const membersData = getMembers(guildId, 1, 20);
  const channels = getChannels(guildId);

  const totalMembers = calculateTotalMembers(membersData, memberStats, guildId);
  const totalChannels = channels.length;

  const isLoadingMembers = (membersLoading || loadingStats) && totalMembers === null;
  const isLoadingChannels = channelsLoading && totalChannels === 0 && !channelsError;

  const hasMembersError = !!(membersStoreError || membersError);
  const hasChannelsError = !!(channelsStoreError || channelsError);
  const textChannels = channels.filter(ch => 'type' in ch && (ch.type === 0 || ch.type === 5)).length;
  const voiceChannels = channels.filter(ch => 'type' in ch && (ch.type === 2 || ch.type === 13)).length;
  const channelDescription = textChannels > 0 || voiceChannels > 0 
    ? `${textChannels} text, ${voiceChannels} voice`
    : 'Server channels';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground">Guild metrics and statistics</p>
        </div>
        <DrawerTrigger onClick={() => setDrawerOpen(true)} />
      </div>

      {(membersStoreError || membersError) && (
        <ErrorDisplay 
          error={membersStoreError || membersError || 'Unknown error'} 
          onRetry={() => {
            setMembersError(null);
            fetchMembers(guildId, 1, 20);
          }}
        />
      )}
      {(channelsStoreError || channelsError) && (
        <ErrorDisplay 
          error={channelsStoreError || channelsError || 'Unknown error'} 
          onRetry={() => {
            setChannelsError(null);
            fetchChannels(guildId);
          }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Members"
          value={totalMembers}
          description={memberStats?.activeMembers != null ? `${memberStats.activeMembers} active` : undefined}
          icon={Users}
          isLoading={isLoadingMembers}
          error={hasMembersError}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900"
        />
        <MetricCard
          title="New This Week"
          value={memberStats?.newThisWeek ?? null}
          description="Last 7 days"
          icon={UserPlus}
          isLoading={isLoadingMembers}
          error={hasMembersError}
          iconColor="text-green-600"
          iconBg="bg-green-100 dark:bg-green-900"
        />
        <MetricCard
          title="Total Channels"
          value={totalChannels}
          description={channelDescription}
          icon={Hash}
          isLoading={isLoadingChannels}
          error={hasChannelsError}
          iconColor="text-purple-600"
          iconBg="bg-purple-100 dark:bg-purple-900"
        />
        <MetricCard
          title="Leagues"
          value={0}
          description="Coming soon"
          icon={Trophy}
          isLoading={false}
          error={false}
          iconColor="text-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900"
        />
      </div>

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
