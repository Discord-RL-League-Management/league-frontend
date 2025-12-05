import { create } from 'zustand';
import { guildApi } from '../lib/api/guilds.js';
import type { DiscordChannel } from '../types/discord.js';

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
    // Input validation
    if (!guildId || typeof guildId !== 'string' || guildId.trim() === '') {
      console.warn('fetchChannels called with invalid guildId:', guildId);
      return;
    }

    // Return cached if exists
    if (get().channels[guildId]) {
      return;
    }

    // Check if request already in-flight
    const existingRequest = get().pendingRequests[guildId];
    if (existingRequest) {
      return existingRequest;
    }

    // Create abort controller for cleanup
    const abortController = new AbortController();
    let isAborted = false;

    // Create new request promise
    const requestPromise = (async () => {
      try {
        // Check if aborted before starting
        if (isAborted) {
          return;
        }

        set({ error: null, loading: true });
        const data = await guildApi.getGuildChannels(guildId);
        
        // Check if aborted after fetch completes
        if (isAborted) {
          return;
        }
        
        set((state) => ({
          channels: {
            ...state.channels,
            [guildId]: data,
          },
          loading: false,
        }));
      } catch (err: any) {
        // Don't update state if aborted
        if (isAborted) {
          return;
        }
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

    // Store abort function for cleanup
    (requestPromise as any).abort = () => {
      isAborted = true;
      abortController.abort();
    };

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








