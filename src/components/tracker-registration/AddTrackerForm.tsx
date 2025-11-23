import { useState } from 'react';
import { useTrackersStore } from '../../stores/trackersStore.js';
import { useNavigate } from 'react-router-dom';
import { validateTrackerUrl, type ValidationResult } from '../../utils/trackerValidation.js';
import { CheckCircle2, XCircle } from 'lucide-react';

export function AddTrackerForm() {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { addTracker, error, clearError, myTrackers } = useTrackersStore();
  const navigate = useNavigate();

  const remainingSlots = 4 - myTrackers.length;

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value.trim()) {
      const result = validateTrackerUrl(value.trim());
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!url.trim()) {
      return;
    }

    const result = validateTrackerUrl(url.trim());
    if (!result.isValid) {
      setValidationResult(result);
      return;
    }

    setIsSubmitting(true);
    try {
      await addTracker(url.trim());
      navigate('/dashboard/trackers');
    } catch (err) {
      console.error('Failed to add tracker:', err);
      // Error is already set in the store
    } finally {
      setIsSubmitting(false);
    }
  };

  if (remainingSlots === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Maximum Trackers Reached</h3>
        <p className="text-gray-600">
          You have reached the maximum of 4 trackers. Please remove one before adding another.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">Add Tracker</h3>
      <p className="text-gray-600 mb-4">
        You can add {remainingSlots} more tracker(s). ({myTrackers.length}/4)
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tracker URL
          </label>
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://rocketleague.tracker.network/rocket-league/profile/steam/username/overview"
              className={`w-full px-4 py-2 pr-10 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                validationResult?.isValid
                  ? 'border-green-300 focus:border-green-500'
                  : validationResult?.isValid === false
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {validationResult && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {validationResult.isValid ? (
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
          disabled={isSubmitting || !url.trim() || !validationResult?.isValid}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Add Tracker'}
        </button>
      </form>
    </div>
  );
}

