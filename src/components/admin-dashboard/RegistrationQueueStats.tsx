import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { QueueStats } from '@/types/trackers.ts';

interface RegistrationQueueStatsProps {
  queueStats: QueueStats | null;
  loading: boolean;
}

/**
 * RegistrationQueueStats - Single responsibility: Display queue statistics in accordion header
 * Pure presentation component - no data fetching, no state management
 * Separation of Concerns: Handles only rendering logic
 */
export function RegistrationQueueStats({ queueStats, loading }: RegistrationQueueStatsProps) {
  if (loading && !queueStats) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>
    );
  }

  if (!queueStats) {
    return (
      <span className="text-muted-foreground">No stats available</span>
    );
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Pending:</span>
        <Badge variant={queueStats.pending > 0 ? 'default' : 'secondary'}>
          {queueStats.pending}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Processing:</span>
        <Badge variant={queueStats.processing > 0 ? 'default' : 'secondary'}>
          {queueStats.processing}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Completed:</span>
        <Badge variant="secondary">
          {queueStats.completed}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rejected:</span>
        <Badge variant="outline">
          {queueStats.rejected}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Failed:</span>
        <Badge variant={queueStats.failed > 0 ? 'destructive' : 'outline'}>
          {queueStats.failed}
        </Badge>
      </div>
    </div>
  );
}






