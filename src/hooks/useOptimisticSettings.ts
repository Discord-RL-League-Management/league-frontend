import { useState, useCallback, useEffect } from 'react';
import { guildApi } from '../lib/api';

export function useOptimisticSettings(guildId: string) {
  const [settings, setSettings] = useState(null);
  const [pendingUpdates, setPendingUpdates] = useState(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        const data = await guildApi.getGuildSettings(guildId);
        setSettings(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load settings');
      } finally {
        setInitialLoading(false);
      }
    };

    if (guildId) {
      loadSettings();
    }
  }, [guildId]);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      setInitialLoading(true);
      const data = await guildApi.getGuildSettings(guildId);
      setSettings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setInitialLoading(false);
    }
  }, [guildId]);

  const updateSettings = useCallback(async (updates: any) => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Store current settings for rollback
      const previousSettings = settings ? JSON.parse(JSON.stringify(settings)) : null;
      
      // Optimistic update
      const optimisticSettings = settings ? JSON.parse(JSON.stringify({ ...settings, ...updates })) : updates;
      setSettings(optimisticSettings);
      
      // Track pending update
      const updateId = Date.now().toString();
      setPendingUpdates(prev => new Map(prev).set(updateId, updates));
      
      // Make API call
      await guildApi.updateGuildSettings(guildId, updates);
      
      // Remove from pending updates
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(updateId);
        return newMap;
      });
      
    } catch (err: any) {
      // Rollback on failure
      setSettings(previousSettings);
      setError(err.response?.data?.message || 'Failed to update settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [guildId, settings]);

  const retry = useCallback(() => {
    setError(null);
    refetch();
  }, [refetch]);

  return { 
    settings, 
    updateSettings, 
    refetch,
    pendingUpdates, 
    error, 
    retry,
    isLoading,
    initialLoading
  };
}
