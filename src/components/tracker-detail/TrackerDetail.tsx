import { useEffect } from 'react';
import { useTrackersStore } from '../../stores/trackersStore.ts';
import type { TrackerSeason, PlaylistData } from '../../types/trackers.ts';

interface TrackerDetailProps {
  trackerId: string;
}

export function TrackerDetail({ trackerId }: TrackerDetailProps) {
  const { trackerDetail, loading, error, getTrackerDetail, refreshTracker, getScrapingStatus } = useTrackersStore();

  useEffect(() => {
    if (trackerId) {
      getTrackerDetail(trackerId);
      getScrapingStatus(trackerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackerId]);

  const handleRefresh = async () => {
    try {
      await refreshTracker(trackerId);
      // Status will be updated automatically
    } catch (err) {
      console.error('Failed to refresh tracker:', err);
    }
  };

  if (loading && !trackerDetail) {
    return <div className="p-4">Loading tracker details...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!trackerDetail) {
    return <div className="p-4">Tracker not found</div>;
  }

  // Handle response format: {tracker, seasons}
  const tracker = trackerDetail.tracker;
  const seasons = trackerDetail.seasons || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Tracker Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{tracker.username}</h1>
            <p className="text-gray-600">{tracker.platform}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tracker.scrapingStatus)}`}>
              {tracker.scrapingStatus}
            </span>
            <button
              onClick={handleRefresh}
              disabled={loading || tracker.scrapingStatus === 'IN_PROGRESS'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Tracker URL</p>
            <a
              href={tracker.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on Tracker.gg
            </a>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Scraped</p>
            <p className="text-sm">
              {tracker.lastScrapedAt
                ? new Date(tracker.lastScrapedAt).toLocaleString()
                : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Scraping Attempts</p>
            <p className="text-sm">{tracker.scrapingAttempts}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Seasons</p>
            <p className="text-sm">{seasons.length}</p>
          </div>
        </div>

        {tracker.scrapingError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {tracker.scrapingError}
            </p>
          </div>
        )}
      </div>

      {/* Seasons Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Season History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Season</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">1v1</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">2v2</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">3v3</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">4v4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {seasons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No season data available
                  </td>
                </tr>
              ) : (
                seasons.map((season: TrackerSeason) => (
                  <tr key={season.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {season.seasonName || `Season ${season.seasonNumber}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Scraped: {new Date(season.scrapedAt).toLocaleDateString()}
                      </div>
                    </td>
                    {(['playlist1v1', 'playlist2v2', 'playlist3v3', 'playlist4v4'] as const).map((playlistKey) => {
                      const playlist = season[playlistKey] as PlaylistData | null;
                      return (
                        <td key={playlistKey} className="px-6 py-4">
                          {playlist ? (
                            <div className="text-sm">
                              <div className="font-medium">{playlist.rank || 'N/A'}</div>
                              <div className="text-xs text-gray-500">
                                {playlist.rating ? `MMR: ${playlist.rating}` : ''}
                              </div>
                              <div className="text-xs text-gray-500">
                                {playlist.matchesPlayed ? `${playlist.matchesPlayed} games` : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

