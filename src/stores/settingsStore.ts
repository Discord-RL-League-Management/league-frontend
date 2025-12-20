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
    if (!guildId || typeof guildId !== 'string' || guildId.trim() === '') {
      console.warn('loadSettings called with invalid guildId:', guildId);
      return;
    }

    // Return cached if exists (don't call set() to avoid triggering re-renders)
    if (get().settings[guildId]) {
      return;
    }

    const existingRequest = get().pendingRequests[guildId];
    if (existingRequest) {
      return existingRequest;
    }

    let isAborted = false;

    const requestPromise = (async () => {
      try {
        if (isAborted) {
          return;
        }

        set({ error: null, loading: true });
        const data = await guildApi.getGuildSettings(guildId);
        
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
      } catch (err: unknown) {
        if (isAborted) {
          return;
        }
        const errorData = (err as { response?: { data?: { message?: string } } })?.response?.data;
        const errorMessage = errorData?.message || 'Failed to load settings';
        set({ error: errorMessage, loading: false });
        console.error('Error loading settings:', err);
      } finally {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [guildId]: _, ...rest } = state.pendingRequests;
          return { pendingRequests: rest };
        });
      }
    })();

    (requestPromise as Promise<void> & { abort?: () => void }).abort = () => {
      isAborted = true;
    };

    set((state) => ({
      pendingRequests: { ...state.pendingRequests, [guildId]: requestPromise },
    }));

    return requestPromise;
  },

  updateSettings: async (guildId: string, updates: Partial<GuildSettingsType>) => {
    if (!guildId || typeof guildId !== 'string' || guildId.trim() === '') {
      throw new Error('Invalid guildId provided');
    }

    if (get().pendingUpdates.has(guildId)) {
      throw new Error('Settings update already in progress for this guild');
    }

    try {
      set({ error: null, loading: true });
      
      const currentSettings = get().settings[guildId];
      if (!currentSettings) {
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
      
      set((state) => ({
        pendingUpdates: new Set(state.pendingUpdates).add(guildId),
      }));
      
      await guildApi.updateGuildSettings(guildId, updates);
      
      set((state) => {
        const newSet = new Set(state.pendingUpdates);
        newSet.delete(guildId);
        return { pendingUpdates: newSet };
      });
      
    } catch (err: unknown) {
      // Rollback on failure - reload from server
      const store = get();
      await store.loadSettings(guildId);
      const errorData = (err as { response?: { data?: { message?: string } } })?.response?.data;
      const errorMessage = errorData?.message || 'Failed to update settings';
      set({ error: errorMessage });
      
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
    const currentDraft = get().draftSettings;
    if (!currentDraft) {
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _metadata, ...settingsToSave } = draft as GuildSettingsType & { _metadata?: unknown };
      await guildApi.updateGuildSettings(guildId, settingsToSave);
      
      set((state) => ({
        settings: {
          ...state.settings,
          [guildId]: draft,
        },
        draftSettings: null,
        loading: false,
      }));
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { message?: string } } })?.response?.data;
      const errorMessage = errorData?.message || 'Failed to save settings';
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
      set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [guildId]: _, ...restSettings } = state.settings;
        return { settings: restSettings };
      });
      const store = get();
      await store.loadSettings(guildId);
      set({ draftSettings: null });
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { message?: string } } })?.response?.data;
      const errorMessage = errorData?.message || 'Failed to reset settings';
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

