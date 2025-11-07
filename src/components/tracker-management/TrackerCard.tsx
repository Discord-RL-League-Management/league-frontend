import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import type { Tracker } from '@/types/trackers.ts';
import { Edit2, Trash2, ExternalLink } from 'lucide-react';

interface TrackerCardProps {
  tracker: Tracker;
  onEdit: (tracker: Tracker) => void;
  onDelete: (tracker: Tracker) => void;
  loading?: boolean;
}

/**
 * TrackerCard - Display individual tracker information
 */
export function TrackerCard({ tracker, onEdit, onDelete, loading }: TrackerCardProps) {
  const formatPlatformName = (platform: string): string => {
    const platformNames: Record<string, string> = {
      STEAM: 'Steam',
      EPIC: 'Epic Games',
      XBL: 'Xbox Live',
      PSN: 'PlayStation Network',
      SWITCH: 'Nintendo Switch',
    };
    return platformNames[platform] || platform;
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          {tracker.user && <UserAvatar user={tracker.user} size="sm" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-medium truncate">
                {tracker.displayName || tracker.username}
              </div>
              {!tracker.isActive && (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              @{tracker.username}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(tracker)}
            disabled={loading}
            aria-label="Edit tracker"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(tracker)}
            disabled={loading}
            aria-label="Delete tracker"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Platform:</span>
          <Badge variant="outline">{formatPlatformName(tracker.platform)}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Game:</span>
          <span>{tracker.game}</span>
        </div>
        <div>
          <a
            href={tracker.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            View on TRN
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}


