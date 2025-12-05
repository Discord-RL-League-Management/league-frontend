import { create } from 'zustand';
import { guildApi } from '../lib/api/index.ts';
import type { GuildSettingsType } from '../types/index.ts';

interface SettingsState {
  settings: Record<string, GuildSettingsType>; // Per-guild settings cache
  draftSettings: GuildSettingsType | null; // Editable copy for edit mode (current guild only)
  loading: boolean;
  error: string | null;
  pendingUpdates: Set<string>;
  pendingRequests: Record<string, Promise<void>>; // Track in-flight requests per guild
  loadSettings: (guildId: string) => Promise<void>;
  updateSettings: (guildId: string, updates: Partial<GuildSettingsType>) => Promise<void>;
  updateDraftSettings: (updates: Partial<GuildSettingsType>) => void;
  saveDraftSettings: (guildId: string) => Promise<void>;
  cancelEdit: () => void;
  resetSettings: (guildId: string) => Promise<void>;
  retry: (guildId: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  draftSettings: null,
  loading: false,
  error: null,
  pendingUpdates: new Set(),
  pendingRequests: {},

  loadSettings: async (guildId: string) => {
    // Input validation
    if (!guildId || typeof guildId !== 'string' || guildId.trim() === '') {
      console.warn('loadSettings called with invalid guildId:', guildId);
      return;
    }

    // Return cached if exists (don't call set() to avoid triggering re-renders)
    if (get().settings[guildId]) {
      return;
    }

    // Check if request already in-flight
    const existingRequest = get().pendingRequests[guildId];
    if (existingRequest) {
      return existingRequest;
    }

    // Create abort controller for cleanup
    let isAborted = false;

    // Create new request promise
    const requestPromise = (async () => {
      try {
        // Check if aborted before starting
        if (isAborted) {
          return;
        }

        set({ error: null, loading: true });
        const data = await guildApi.getGuildSettings(guildId);
        
        // Check if aborted after fetch completes
        if (isAborted) {
          return;
        }
        
        set((state) => ({
          settings: {
            ...state.settings,
            [guildId]: data,
          },
          draftSettings: null,
          loading: false,
        }));
      } catch (err: any) {
        // Don't update state if aborted
        if (isAborted) {
          return;
        }
        const errorMessage = err.response?.data?.message || 'Failed to load settings';
        set({ error: errorMessage, loading: false });
        console.error('Error loading settings:', err);
      } finally {
        // Clean up pending request
        set((state) => {
          const { [guildId]: _, ...rest } = state.pendingRequests;
          return { pendingRequests: rest };
        });
      }
    })();

    // Store abort function for cleanup
    (requestPromise as any).abort = () => {
      isAborted = true;
    };

    // Track pending request
    set((state) => ({
      pendingRequests: { ...state.pendingRequests, [guildId]: requestPromise },
    }));

    return requestPromise;
  },

  updateSettings: async (guildId: string, updates: Partial<GuildSettingsType>) => {
    // Input validation
    if (!guildId || typeof guildId !== 'string' || guildId.trim() === '') {
      throw new Error('Invalid guildId provided');
    }

    // Prevent concurrent updates to the same guild
    if (get().pendingUpdates.has(guildId)) {
      throw new Error('Settings update already in progress for this guild');
    }

    try {
      set({ error: null, loading: true });
      
      const currentSettings = get().settings[guildId];
      if (!currentSettings) {
        // Load settings first if not cached
        await get().loadSettings(guildId);
        const loadedSettings = get().settings[guildId];
        if (!loadedSettings) {
          throw new Error('Settings not loaded for this guild');
        }
      }
      
      const previousSettings = get().settings[guildId];
      
      // Optimistic update
      const optimisticSettings = { ...previousSettings, ...updates };
      set((state) => ({
        settings: {
          ...state.settings,
          [guildId]: optimisticSettings,
        },
      }));
      
      // Track pending update using guildId as key to prevent concurrent updates
      set((state) => ({
        pendingUpdates: new Set(state.pendingUpdates).add(guildId),
      }));
      
      // Make API call
      await guildApi.updateGuildSettings(guildId, updates);
      
      // Remove from pending updates
      set((state) => {
        const newSet = new Set(state.pendingUpdates);
        newSet.delete(guildId);
        return { pendingUpdates: newSet };
      });
      
    } catch (err: any) {
      // Rollback on failure - reload from server
      const store = get();
      await store.loadSettings(guildId);
      const errorMessage = err.response?.data?.message || 'Failed to update settings';
      set({ error: errorMessage });
      
      // Remove from pending updates on error
      set((state) => {
        const newSet = new Set(state.pendingUpdates);
        newSet.delete(guildId);
        return { pendingUpdates: newSet };
      });
      
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateDraftSettings: (updates: Partial<GuildSettingsType>) => {
    // Note: draftSettings is for the current guild being edited
    // This should be called with the current guildId context
    const currentDraft = get().draftSettings;
    if (!currentDraft) {
      // If no draft exists, initialize it with the provided updates
      // This allows handleEdit to initialize the draft by passing allSettings
      set({ draftSettings: updates as GuildSettingsType });
      return;
    }
    
    const updatedDraft = { ...currentDraft, ...updates };
    set({ draftSettings: updatedDraft });
  },

  saveDraftSettings: async (guildId: string) => {
    const draft = get().draftSettings;
    if (!draft) {
      throw new Error('No draft settings to save');
    }

    try {
      set({ error: null, loading: true });
      
      // Strip _metadata before sending to API (it's internal-only)
      const { _metadata, ...settingsToSave } = draft as any;
      await guildApi.updateGuildSettings(guildId, settingsToSave);
      
      // Update settings cache for this guild and clear draft
      set((state) => ({
        settings: {
          ...state.settings,
          [guildId]: draft,
        },
        draftSettings: null,
        loading: false,
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save settings';
      set({ error: errorMessage, loading: false });
      throw err;
    }
  },

  cancelEdit: () => {
    set({ draftSettings: null, error: null });
  },

  resetSettings: async (guildId: string) => {
    try {
      set({ loading: true, error: null });
      await guildApi.resetGuildSettings(guildId);
      // Clear cache for this guild before reloading to force fresh fetch
      set((state) => {
        const { [guildId]: _, ...restSettings } = state.settings;
        return { settings: restSettings };
      });
      // Reload settings after reset and clear draft
      const store = get();
      await store.loadSettings(guildId);
      set({ draftSettings: null });
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

