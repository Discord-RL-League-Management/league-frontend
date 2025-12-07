import { create } from 'zustand';
import { guildApi } from '../lib/api/guilds.js';
import type { DiscordChannel } from '../types/discord.js';

interface ChannelCache {
  data: DiscordChannel[];
  timestamp: number;
}

interface ChannelsState {
  channels: Record<string, ChannelCache>; // Per-guild channels cache with timestamps
  loading: boolean;
  error: string | null;
  pendingRequests: Record<string, Promise<void>>; // Track in-flight requests per guild
  fetchChannels: (guildId: string) => Promise<void>;
  getChannels: (guildId: string) => DiscordChannel[];
}

const CHANNELS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    if (!guildId || typeof guildId !== 'string' || guildId.trim() === '') {
      console.warn('fetchChannels called with invalid guildId:', guildId);
      return;
    }

    // Check cache with TTL
    const cached = get().channels[guildId];
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < CHANNELS_CACHE_TTL) {
        return; // Cache is still valid
      }
    }

    const existingRequest = get().pendingRequests[guildId];
    if (existingRequest) {
      return existingRequest;
    }

    const abortController = new AbortController();
    let isAborted = false;

    const requestPromise = (async () => {
      try {
        if (isAborted) {
          return;
        }

        set({ error: null, loading: true });
        const data = await guildApi.getGuildChannels(guildId);
        
        if (isAborted) {
          return;
        }
        
        set((state) => ({
          channels: {
            ...state.channels,
            [guildId]: {
              data,
              timestamp: Date.now(),
            },
          },
          loading: false,
        }));
      } catch (err: unknown) {
        if (isAborted) {
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch channels';
        set({ error: errorMessage, loading: false });
        console.error('Error fetching channels:', err);
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
      abortController.abort();
    };

    set((state) => ({
      pendingRequests: { ...state.pendingRequests, [guildId]: requestPromise },
    }));

    return requestPromise;
  },

  getChannels: (guildId: string) => {
    const cached = get().channels[guildId];
    return cached?.data || [];
  },
}));








