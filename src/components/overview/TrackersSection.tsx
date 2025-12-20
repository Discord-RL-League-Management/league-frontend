import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui/skeleton.js';
import { Badge } from '@/components/ui/badge.js';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { TrackerRegistrationForm } from '@/components/tracker-registration/TrackerRegistrationForm.js';
import { sanitizeUrl } from '@/utils/urlSanitization.js';
import type { Tracker } from '@/types/trackers.js';

interface TrackersSectionProps {
  myTrackers: Tracker[];
  isLoading: boolean;
}

/**
 * TrackersSection Component
 * 
 * Displays user's trackers with status, links, and registration form if empty.
 */
export function TrackersSection({ myTrackers, isLoading }: TrackersSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Trackers ({myTrackers.length}/4)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32" />
        ) : myTrackers.length > 0 ? (
          <div className="space-y-4">
            {myTrackers.map((tracker) => (
              <div key={tracker.id} className="space-y-4 border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{tracker.username}</h3>
                    <p className="text-sm text-muted-foreground">{tracker.platform}</p>
                  </div>
                  <Badge
                    variant={
                      tracker.scrapingStatus === 'COMPLETED'
                        ? 'default'
                        : tracker.scrapingStatus === 'IN_PROGRESS'
                        ? 'secondary'
                        : tracker.scrapingStatus === 'FAILED'
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {tracker.scrapingStatus}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {tracker.lastScrapedAt && (
                    <span>
                      Last updated: {new Date(tracker.lastScrapedAt).toLocaleDateString()}
                    </span>
                  )}
                  {tracker.seasons && tracker.seasons.length > 0 && (
                    <span>{tracker.seasons.length} seasons tracked</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/dashboard/tracker/${tracker.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    View Details
                  </Link>
                  {(() => {
                    const safeUrl = sanitizeUrl(tracker.url);
                    return safeUrl ? (
                      <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Tracker.gg
                      </a>
                    ) : null;
                  })()}
                </div>
              </div>
            ))}
            {myTrackers.length < 4 && (
              <div className="pt-4">
                <Link
                  to="/dashboard/trackers"
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-sm inline-block"
                >
                  Add Another Tracker
                </Link>
              </div>
            )}
            <div className="pt-2">
              <Link
                to="/dashboard/trackers"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Manage All Trackers →
              </Link>
            </div>
          </div>
        ) : (
          <TrackerRegistrationForm />
        )}
      </CardContent>
    </Card>
  );
}

