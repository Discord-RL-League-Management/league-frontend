import { Skeleton } from '@/components/ui/skeleton.js';

interface MetricsDisplayProps {
  totalMembers: number | null;
  activeMembers: number | null;
  newThisWeek: number | null;
  totalChannels: number | null;
  channelDescription: string;
  isLoadingMembers: boolean;
  isLoadingChannels: boolean;
  hasMembersError: boolean;
  hasChannelsError: boolean;
}

/**
 * MetricsDisplay - Single responsibility: Display metrics in a clean format
 * Pure presentation component - no data fetching, no state management
 * Separation of Concerns: Handles only rendering logic
 */
export function MetricsDisplay({
  totalMembers,
  activeMembers,
  newThisWeek,
  totalChannels,
  channelDescription,
  isLoadingMembers,
  isLoadingChannels,
  hasMembersError,
  hasChannelsError,
}: MetricsDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Total Members */}
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">Total Members</div>
        {isLoadingMembers ? (
          <Skeleton className="h-6 w-16" />
        ) : hasMembersError ? (
          <span className="text-sm text-destructive">Error</span>
        ) : (
          <div className="text-lg font-semibold">
            {totalMembers?.toLocaleString() ?? '—'}
            {activeMembers !== null && (
              <span className="text-sm text-muted-foreground font-normal ml-2">
                ({activeMembers} active)
              </span>
            )}
          </div>
        )}
      </div>

      {/* New This Week */}
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">New This Week</div>
        {isLoadingMembers ? (
          <Skeleton className="h-6 w-16" />
        ) : hasMembersError ? (
          <span className="text-sm text-destructive">Error</span>
        ) : (
          <div className="text-lg font-semibold">
            {newThisWeek?.toLocaleString() ?? '—'}
            <span className="text-sm text-muted-foreground font-normal ml-2">
              (last 7 days)
            </span>
          </div>
        )}
      </div>

      {/* Total Channels */}
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">Total Channels</div>
        {isLoadingChannels ? (
          <Skeleton className="h-6 w-16" />
        ) : hasChannelsError ? (
          <span className="text-sm text-destructive">Error</span>
        ) : (
          <div className="text-lg font-semibold">
            {totalChannels?.toLocaleString() ?? '—'}
            {channelDescription && (
              <span className="text-sm text-muted-foreground font-normal ml-2">
                ({channelDescription})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Leagues */}
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">Leagues</div>
        <div className="text-lg font-semibold">
          0
          <span className="text-sm text-muted-foreground font-normal ml-2">
            (coming soon)
          </span>
        </div>
      </div>
    </div>
  );
}






