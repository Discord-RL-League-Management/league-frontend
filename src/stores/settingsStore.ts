import { create } from 'zustand';
import { guildApi } from '../lib/api';
import type { GuildSettingsType } from '../types';

interface SettingsState {
  settings: GuildSettingsType | null;
  loading: boolean;
  error: string | null;
  pendingUpdates: Set<string>;
  loadSettings: (guildId: string) => Promise<void>;
  updateSettings: (guildId: string, updates: Partial<GuildSettingsType>) => Promise<void>;
  resetSettings: (guildId: string) => Promise<void>;
  retry: (guildId: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,
  error: null,
  pendingUpdates: new Set(),

  loadSettings: async (guildId: string) => {
    try {
      set({ error: null, loading: true });
      const data = await guildApi.getGuildSettings(guildId);
      set({ settings: data, loading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load settings';
      set({ error: errorMessage, loading: false });
      console.error('Error loading settings:', err);
    }
  },

  updateSettings: async (guildId: string, updates: Partial<GuildSettingsType>) => {
    try {
      set({ error: null, loading: true });
      
      // Store current settings for rollback
      const previousSettings = get().settings;
      
      // Optimistic update
      const optimisticSettings = previousSettings 
        ? { ...previousSettings, ...updates } 
        : updates as GuildSettingsType;
      set({ settings: optimisticSettings });
      
      // Track pending update
      const updateId = Date.now().toString();
      set((state) => ({
        pendingUpdates: new Set(state.pendingUpdates).add(updateId),
      }));
      
      // Make API call
      await guildApi.updateGuildSettings(guildId, updates);
      
      // Remove from pending updates
      set((state) => {
        const newSet = new Set(state.pendingUpdates);
        newSet.delete(updateId);
        return { pendingUpdates: newSet };
      });
      
    } catch (err: any) {
      // Rollback on failure
      set({ settings: get().settings });
      const errorMessage = err.response?.data?.message || 'Failed to update settings';
      set({ error: errorMessage });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  resetSettings: async (guildId: string) => {
    try {
      set({ loading: true, error: null });
      await guildApi.resetGuildSettings(guildId);
      // Reload settings after reset
      const store = get();
      await store.loadSettings(guildId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reset settings';
      set({ error: errorMessage });
      console.error('Error resetting settings:', err);
    } finally {
      set({ loading: false });
    }
  },

  retry: (guildId: string) => {
    const store = get();
    store.loadSettings(guildId);
  },
}));

