import { useState, useEffect } from 'react';
import { useTrackersStore } from '../../stores/trackersStore';
import { useNavigate } from 'react-router-dom';
import { validateTrackerUrl, type ValidationResult } from '../../utils/trackerValidation';
import { CheckCircle2, XCircle } from 'lucide-react';

export function TrackerRegistrationForm() {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingTracker, setIsCheckingTracker] = useState(true);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { registerTracker, error, clearError, getMyTracker, myTracker } = useTrackersStore();
  const navigate = useNavigate();

  // Pre-check for existing tracker
  useEffect(() => {
    const checkExistingTracker = async () => {
      setIsCheckingTracker(true);
      try {
        await getMyTracker();
      } catch (err) {
        console.error('Failed to check existing tracker:', err);
      } finally {
        setIsCheckingTracker(false);
      }
    };

    checkExistingTracker();
  }, [getMyTracker]);

  // Pre-populate URL if tracker exists
  useEffect(() => {
    if (myTracker && !url) {
      setUrl(myTracker.url);
      // Validate the pre-populated URL
      const result = validateTrackerUrl(myTracker.url);
      setValidationResult(result);
    }
  }, [myTracker]); // Only run when myTracker changes, not when url changes

  // Real-time validation as user types
  useEffect(() => {
    if (url.trim()) {
      const result = validateTrackerUrl(url.trim());
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!url.trim()) {
      return;
    }

    // Final validation check
    const result = validateTrackerUrl(url.trim());
    if (!result.isValid) {
      setValidationResult(result);
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

  const isUpdateMode = !!myTracker;
  const isUrlValid = validationResult?.isValid ?? false;
  const showValidationIcon = url.trim().length > 0;

  if (isCheckingTracker) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Checking for existing tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isUpdateMode ? 'Update Your Tracker' : 'Register Your Tracker'}
      </h2>
      <p className="text-gray-600 mb-6">
        {isUpdateMode
          ? 'Update your Rocket League tracker URL to continue tracking your ranked statistics.'
          : 'Enter your Rocket League tracker URL to start tracking your ranked statistics.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tracker-url" className="block text-sm font-medium text-gray-700 mb-2">
            Tracker URL
          </label>
          <div className="relative">
            <input
              id="tracker-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://rocketleague.tracker.network/rocket-league/profile/steam/username/overview"
              className={`w-full px-4 py-2 pr-10 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                showValidationIcon
                  ? isUrlValid
                    ? 'border-green-300 focus:border-green-500'
                    : 'border-red-300 focus:border-red-500'
                  : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {showValidationIcon && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isUrlValid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            )}
          </div>
          {validationResult && !validationResult.isValid && (
            <p className="mt-1 text-sm text-red-600">{validationResult.error}</p>
          )}
          {validationResult && validationResult.isValid && (
            <p className="mt-1 text-sm text-green-600">
              Valid tracker URL ({validationResult.platform} - {validationResult.username})
            </p>
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
          disabled={isSubmitting || !url.trim() || !isUrlValid}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? isUpdateMode
              ? 'Updating...'
              : 'Registering...'
            : isUpdateMode
              ? 'Update Tracker'
              : 'Register Tracker'}
        </button>
      </form>
    </div>
  );
}

