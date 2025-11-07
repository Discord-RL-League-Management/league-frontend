import { TrackerCard } from './TrackerCard';
import { LoadingState } from '@/components/loading-state';
import { ErrorDisplay } from '@/components/error-display';
import type { Tracker } from '@/types/trackers.ts';

interface TrackerListProps {
  trackers: Tracker[];
  loading?: boolean;
  error?: string | null;
  onEdit: (tracker: Tracker) => void;
  onDelete: (tracker: Tracker) => void;
  onRetry?: () => void;
}

/**
 * TrackerList - Display list of trackers
 */
export function TrackerList({
  trackers,
  loading = false,
  error,
  onEdit,
  onDelete,
  onRetry,
}: TrackerListProps) {
  if (loading && trackers.length === 0) {
    return <LoadingState message="Loading trackers..." />;
  }

  if (error && trackers.length === 0) {
    return <ErrorDisplay error={error} onRetry={onRetry} />;
  }

  if (trackers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No trackers found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trackers.map((tracker) => (
        <TrackerCard
          key={tracker.id}
          tracker={tracker}
          onEdit={onEdit}
          onDelete={onDelete}
          loading={loading}
        />
      ))}
    </div>
  );
}


