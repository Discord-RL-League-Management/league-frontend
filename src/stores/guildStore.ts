import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { guildApi } from '../lib/api/index.ts';
import type { Guild } from '../types/index.ts';

interface GuildState {
  guilds: Guild[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  pendingRequest: Promise<void> | null;
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

        if (state.pendingRequest && !force) {
          return state.pendingRequest;
        }

        const CACHE_TTL = 300000;
        if (
          !force &&
          state.lastFetched &&
          Date.now() - state.lastFetched < CACHE_TTL &&
          state.guilds.length > 0
        ) {
          return Promise.resolve();
        }

        let resolveFn: (() => void) | undefined;
        let rejectFn: ((err: unknown) => void) | undefined;

        const requestPromise = new Promise<void>((resolve, reject) => {
          resolveFn = resolve;
          rejectFn = reject;
        });

        // CRITICAL: Set in-flight flag SYNCHRONOUSLY before any async work
        // This prevents race conditions when multiple components call this simultaneously
        set({ pendingRequest: requestPromise });

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
          } catch (err: unknown) {
            // Don't retry on rate limit (429) errors - prevent infinite loops
            const errorObj = err as { status?: number; response?: { status?: number; data?: { message?: string } } };
            if (errorObj.status === 429 || errorObj.response?.status === 429) {
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
            const errorMessage = errorObj.response?.data?.message || 'Failed to load guilds';
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
        store.fetchGuilds(true);
      },
    }),
    {
      name: 'guild-store',
      partialize: (state) => ({ guilds: state.guilds, lastFetched: state.lastFetched }),
    }
  )
);

