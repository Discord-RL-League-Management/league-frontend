import { useState } from 'react';
import { useTrackersStore } from '../../stores/trackersStore';
import { useNavigate } from 'react-router-dom';

export function TrackerRegistrationForm() {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerTracker, error, clearError } = useTrackersStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!url.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerTracker(url.trim());
      // Redirect to tracker detail page
      const tracker = useTrackersStore.getState().myTracker;
      if (tracker) {
        navigate(`/dashboard/tracker/${tracker.id}`);
      }
    } catch (err) {
      console.error('Failed to register tracker:', err);
      // Error is already set in the store
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname === 'rocketleague.tracker.network' &&
        urlObj.pathname.includes('/rocket-league/profile/') &&
        urlObj.pathname.endsWith('/overview')
      );
    } catch {
      return false;
    }
  };

  const urlError = url && !isValidUrl(url)
    ? 'Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview'
    : null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Register Your Tracker</h2>
      <p className="text-gray-600 mb-6">
        Enter your Rocket League tracker URL to start tracking your ranked statistics.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tracker-url" className="block text-sm font-medium text-gray-700 mb-2">
            Tracker URL
          </label>
          <input
            id="tracker-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://rocketleague.tracker.network/rocket-league/profile/steam/username/overview"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          />
          {urlError && (
            <p className="mt-1 text-sm text-red-600">{urlError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Example: https://rocketleague.tracker.network/rocket-league/profile/steam/76561198051701160/overview
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !url.trim() || !!urlError}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Registering...' : 'Register Tracker'}
        </button>
      </form>
    </div>
  );
}

