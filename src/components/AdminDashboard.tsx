import { useEffect, useState } from 'react';
import { ErrorDisplay } from '@/components/error-display.js';
import { useMembersStore } from '@/stores/membersStore.js';
import { useChannelsStore } from '@/stores/channelsStore.js';
import { guildApi } from '@/lib/api/guilds.js';
import { MetricsDrawer } from './admin-dashboard/MetricsDrawer.js';
import { DrawerTrigger } from './admin-dashboard/DrawerTrigger.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui/skeleton.js';
import { Users, UserPlus, Hash, Trophy } from 'lucide-react';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]); // Only depend on guildId, not the functions

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
  }, [guildId]); // Only depend on guildId, not the function

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

  // Determine error state (convert to boolean for MetricsDrawer)
  const hasMembersError = !!(membersStoreError || membersError);
  const hasChannelsError = !!(channelsStoreError || channelsError);

  // Calculate channel types (if type property exists)
  const textChannels = channels.filter(ch => 'type' in ch && (ch.type === 0 || ch.type === 5)).length;
  const voiceChannels = channels.filter(ch => 'type' in ch && (ch.type === 2 || ch.type === 13)).length;
  const channelDescription = textChannels > 0 || voiceChannels > 0 
    ? `${textChannels} text, ${voiceChannels} voice`
    : 'Server channels';

  // Metric Card Component
  const MetricCard = ({ 
    title, 
    value, 
    description,
    icon: Icon, 
    isLoading, 
    error,
    iconColor = "text-muted-foreground",
    iconBg = "bg-muted"
  }: {
    title: string;
    value: string | number | null;
    description?: string;
    icon: React.ElementType;
    isLoading: boolean;
    error?: boolean;
    iconColor?: string;
    iconBg?: string;
  }) => {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`${iconBg} p-2 rounded-lg`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-24 mb-2" />
          ) : error ? (
            <p className="text-sm text-destructive">Error loading</p>
          ) : (
            <>
              <div className="text-4xl font-bold mb-1">{value?.toLocaleString() ?? '—'}</div>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground">Guild metrics and statistics</p>
        </div>
        <DrawerTrigger onClick={() => setDrawerOpen(true)} />
      </div>

      {/* Error displays */}
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

      {/* Metrics Grid */}
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

