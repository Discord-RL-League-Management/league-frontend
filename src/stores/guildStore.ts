import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { guildApi } from '../lib/api/index.ts';
import type { Guild } from '../types/index.ts';

interface GuildState {
  guilds: Guild[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null; // Timestamp of last successful fetch
  pendingRequest: Promise<void> | null; // Track in-flight request
  fetchGuilds: (force?: boolean) => Promise<void>;
  retry: () => void;
}

export const useGuildStore = create<GuildState>()(
  persist(
    (set, get) => ({
      guilds: [],
      loading: false,
      error: null,
      lastFetched: null,
      pendingRequest: null,

      fetchGuilds: async (force = false) => {
        const state = get();

        // If there's already a request in flight, wait for it instead of making a new one
        if (state.pendingRequest && !force) {
          return state.pendingRequest;
        }

        // If we have recent data (within last 5 minutes) and not forcing, use cache
        const CACHE_TTL = 300000; // 5 minutes
        if (
          !force &&
          state.lastFetched &&
          Date.now() - state.lastFetched < CACHE_TTL &&
          state.guilds.length > 0
        ) {
          return Promise.resolve();
        }

        // Create promise with resolve/reject handlers
        let resolveFn: (() => void) | undefined;
        let rejectFn: ((err: any) => void) | undefined;

        const requestPromise = new Promise<void>((resolve, reject) => {
          resolveFn = resolve;
          rejectFn = reject;
        });

        // CRITICAL: Set in-flight flag SYNCHRONOUSLY before any async work
        // This prevents race conditions when multiple components call this simultaneously
        set({ pendingRequest: requestPromise });

        // Now execute the actual async fetch
        (async () => {
          try {
            set({ error: null, loading: true });
            const guilds = await guildApi.getMyGuilds();
            set({
              guilds,
              loading: false,
              lastFetched: Date.now(),
              pendingRequest: null,
            });
            resolveFn!();
          } catch (err: any) {
            // Don't retry on rate limit (429) errors - prevent infinite loops
            if (err.status === 429 || err.response?.status === 429) {
              const errorMessage = 'Too many requests. Please wait a moment before trying again.';
              set({
                error: errorMessage,
                loading: false,
                pendingRequest: null,
              });
              console.error('Rate limited - stopping retries:', err);
              // rejectFn is guaranteed to be defined (assigned synchronously above)
              rejectFn!(err);
              return;
            }
            const errorMessage = err.response?.data?.message || 'Failed to load guilds';
            set({
              error: errorMessage,
              loading: false,
              pendingRequest: null,
            });
            console.error('Error fetching guilds:', err);
            rejectFn!(err);
          }
        })();

        return requestPromise;
      },

      retry: () => {
        const store = useGuildStore.getState();
        store.fetchGuilds(true); // Force refresh on retry
      },
    }),
    {
      name: 'guild-store', // localStorage key
      // Only persist guilds array and lastFetched, not loading/error/pendingRequest states
      partialize: (state) => ({ guilds: state.guilds, lastFetched: state.lastFetched }),
    }
  )
);

