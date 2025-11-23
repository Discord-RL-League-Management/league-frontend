import { useState, useEffect } from 'react';
import { useTrackersStore } from '../../stores/trackersStore.js';
import { useNavigate, Link } from 'react-router-dom';
import { validateTrackerUrl, type ValidationResult } from '../../utils/trackerValidation.js';
import { CheckCircle2, XCircle } from 'lucide-react';

export function TrackerRegistrationForm() {
  const [urls, setUrls] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingTrackers, setIsCheckingTrackers] = useState(true);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const { registerTrackers, error, clearError, getMyTrackers, myTrackers } = useTrackersStore();
  const navigate = useNavigate();

  // Pre-check for existing trackers
  useEffect(() => {
    const checkExistingTrackers = async () => {
      setIsCheckingTrackers(true);
      try {
        await getMyTrackers();
      } catch (err) {
        console.error('Failed to check existing trackers:', err);
      } finally {
        setIsCheckingTrackers(false);
      }
    };

    checkExistingTrackers();
  }, [getMyTrackers]);

  // Add URL field
  const addUrlField = () => {
    if (urls.length < 4) {
      setUrls([...urls, '']);
      setValidationResults([...validationResults, null as any]);
    }
  };

  // Remove URL field
  const removeUrlField = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
    setValidationResults(validationResults.filter((_, i) => i !== index));
  };

  // Update URL at index
  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);

    // Validate
    if (value.trim()) {
      const result = validateTrackerUrl(value.trim());
      const newResults = [...validationResults];
      newResults[index] = result;
      setValidationResults(newResults);
    } else {
      const newResults = [...validationResults];
      newResults[index] = null as any;
      setValidationResults(newResults);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const validUrls = urls.filter(url => url.trim() !== '');
    if (validUrls.length === 0) {
      return;
    }

    // Validate all URLs
    const allValid = validUrls.every(url => {
      const result = validateTrackerUrl(url.trim());
      return result.isValid;
    });

    if (!allValid) {
      // Re-validate all to show errors
      const newResults = urls.map(url => {
        if (url.trim()) {
          return validateTrackerUrl(url.trim());
        }
        return null as any;
      });
      setValidationResults(newResults);
      return;
    }

    setIsSubmitting(true);
    try {
      await registerTrackers(validUrls);
      navigate('/dashboard/trackers');
    } catch (err) {
      console.error('Failed to register trackers:', err);
      // Error is already set in the store
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasExistingTrackers = myTrackers.length > 0;
  const validUrlsCount = urls.filter(url => url.trim() !== '').length;

  if (isCheckingTrackers) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Checking for existing trackers...</p>
        </div>
      </div>
    );
  }

  if (hasExistingTrackers) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">You Already Have Trackers</h2>
        <p className="text-gray-600 mb-4">
          You have {myTrackers.length} tracker(s) registered. Use the "Add Tracker" button to add more.
        </p>
        <Link
          to="/dashboard/trackers"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
        >
          Manage Trackers
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Register Your Trackers</h2>
      <p className="text-gray-600 mb-6">
        Enter up to 4 Rocket League tracker URLs to start tracking your ranked statistics.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {urls.map((url, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracker URL {index + 1}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder="https://rocketleague.tracker.network/rocket-league/profile/steam/username/overview"
                  className={`w-full px-4 py-2 pr-10 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    validationResults[index]?.isValid
                      ? 'border-green-300 focus:border-green-500'
                      : validationResults[index]?.isValid === false
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {validationResults[index] && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validationResults[index].isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeUrlField(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                  disabled={isSubmitting}
                >
                  Remove
                </button>
              )}
            </div>
            {validationResults[index] && !validationResults[index].isValid && (
              <p className="mt-1 text-sm text-red-600">{validationResults[index].error}</p>
            )}
            {validationResults[index] && validationResults[index].isValid && (
              <p className="mt-1 text-sm text-green-600">
                Valid tracker URL ({validationResults[index].platform} - {validationResults[index].username})
              </p>
            )}
            {index === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Example: https://rocketleague.tracker.network/rocket-league/profile/steam/76561198051701160/overview
              </p>
            )}
          </div>
        ))}

        {urls.length < 4 && (
          <button
            type="button"
            onClick={addUrlField}
            className="text-blue-600 hover:text-blue-700 text-sm"
            disabled={isSubmitting}
          >
            + Add Another Tracker ({urls.length}/4)
          </button>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || validUrlsCount === 0 || !validationResults.every((r, i) => !urls[i].trim() || r?.isValid)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Registering...'
            : `Register ${validUrlsCount} Tracker(s)`}
        </button>
      </form>
    </div>
  );
}
