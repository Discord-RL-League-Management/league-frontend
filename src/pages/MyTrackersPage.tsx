import { useEffect, useState } from 'react';
import { useTrackersStore } from '../stores/trackersStore.js';
import { AddTrackerForm } from '../components/tracker-registration/AddTrackerForm.js';
import { TrackerListContainer } from '../components/tracker-management/TrackerListContainer.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Link } from 'react-router-dom';

export default function MyTrackersPage() {
  const { myTrackers, getMyTrackers, fetchTrackers } = useTrackersStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true);
      try {
        await getMyTrackers();
        // Also fetch trackers for the list (without guildId shows user's trackers)
        await fetchTrackers();
      } catch (err) {
        console.error('Failed to load trackers:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (isInitializing) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center py-8">
          <p className="text-gray-600">Loading trackers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Trackers</h1>
        <p className="text-muted-foreground">
          Manage your Rocket League trackers ({myTrackers.length}/4)
        </p>
      </div>

      {myTrackers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Trackers Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Register your first tracker to start tracking your ranked statistics.
            </p>
            <Link
              to="/dashboard/tracker/register"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
            >
              Register Trackers
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <TrackerListContainer />
          {myTrackers.length < 4 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Add Another Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <AddTrackerForm />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

