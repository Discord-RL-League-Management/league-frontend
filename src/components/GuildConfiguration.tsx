import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores';
import type { GuildSettingsType } from '../types';
import { FeaturesTab, ChannelsTab, RolesTab, PermissionsTab, DisplayTab } from './guild-config';

interface GuildConfigurationProps {
  guildId: string;
  onBack?: () => void;
}

export default function GuildConfiguration({ guildId }: GuildConfigurationProps) {
  const [activeTab, setActiveTab] = useState('features');
  const { settings, loading, error, loadSettings, resetSettings, retry } = useSettingsStore();

  useEffect(() => {
    loadSettings(guildId);
  }, [guildId, loadSettings]);

  const handleReset = async () => {
    try {
      await resetSettings(guildId);
    } catch (err: any) {
      console.error('Failed to reset settings:', err);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-400">Loading settings...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-gray-400 text-center py-8">
        No settings found
      </div>
    );
  }

  const tabs = [
    { id: 'features', label: 'Features', icon: '⚙️' },
    { id: 'channels', label: 'Channels', icon: '📢' },
    { id: 'roles', label: 'Roles', icon: '👥' },
    { id: 'permissions', label: 'Permissions', icon: '🔒' },
    { id: 'display', label: 'Display', icon: '🎨' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Guild Configuration</h2>
          <div className="flex gap-2">
            {error && (
              <button
                onClick={() => retry(guildId)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Retry Failed Update
              </button>
            )}
            <button
              onClick={handleReset}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Resetting...' : 'Reset to Defaults'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
            <div className="text-red-200">
              <h4 className="font-semibold">Update Failed</h4>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && settings && (
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6">
            <div className="text-blue-200 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-2"></div>
              Updating settings...
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-700 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-700 rounded-lg p-6">
          {activeTab === 'features' && <FeaturesTab guildId={guildId} />}
          {activeTab === 'channels' && <ChannelsTab guildId={guildId} />}
          {activeTab === 'roles' && <RolesTab guildId={guildId} />}
          {activeTab === 'permissions' && <PermissionsTab guildId={guildId} />}
          {activeTab === 'display' && <DisplayTab guildId={guildId} />}
        </div>
      </div>
    </div>
  );
}

