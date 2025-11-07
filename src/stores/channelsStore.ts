import { create } from 'zustand';
import { guildApi } from '../lib/api/guilds';
import type { DiscordChannel } from '../types/discord';

interface ChannelsState {
  channels: Record<string, DiscordChannel[]>; // Per-guild channels cache
  loading: boolean;
  error: string | null;
  pendingRequests: Record<string, Promise<void>>; // Track in-flight requests per guild
  fetchChannels: (guildId: string) => Promise<void>;
  getChannels: (guildId: string) => DiscordChannel[];
}

/**
 * Channels Store - Centralized state management
 * 
 * Manages Discord channels state per guild ID with caching.
 */
export const useChannelsStore = create<ChannelsState>((set, get) => ({
  channels: {},
  loading: false,
  error: null,
  pendingRequests: {},

  fetchChannels: async (guildId: string) => {
    // Return cached if exists
    if (get().channels[guildId]) {
      return;
    }

    // Check if request already in-flight
    const existingRequest = get().pendingRequests[guildId];
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request promise
    const requestPromise = (async () => {
      try {
        set({ error: null, loading: true });
        const data = await guildApi.getGuildChannels(guildId);
        
        set((state) => ({
          channels: {
            ...state.channels,
            [guildId]: data,
          },
          loading: false,
        }));
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch channels';
        set({ error: errorMessage, loading: false });
        console.error('Error fetching channels:', err);
      } finally {
        // Clean up pending request
        set((state) => {
          const { [guildId]: _, ...rest } = state.pendingRequests;
          return { pendingRequests: rest };
        });
      }
    })();

    // Track pending request
    set((state) => ({
      pendingRequests: { ...state.pendingRequests, [guildId]: requestPromise },
    }));

    return requestPromise;
  },

  getChannels: (guildId: string) => {
    return get().channels[guildId] || [];
  },
}));








