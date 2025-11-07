import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { guildApi } from '../lib/api/index.ts';
import type { Guild } from '../types/index.ts';

interface GuildState {
  guilds: Guild[];
  loading: boolean;
  error: string | null;
  fetchGuilds: () => Promise<void>;
  retry: () => void;
}

export const useGuildStore = create<GuildState>()(
  persist(
    (set) => ({
      guilds: [],
      loading: false,
      error: null,

      fetchGuilds: async () => {
        try {
          set({ loading: true, error: null });
          const guilds = await guildApi.getMyGuilds();
          set({ guilds, loading: false });
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || 'Failed to load guilds';
          set({ error: errorMessage, loading: false });
          console.error('Error fetching guilds:', err);
        }
      },

      retry: () => {
        const store = useGuildStore.getState();
        store.fetchGuilds();
      },
    }),
    {
      name: 'guild-store', // localStorage key
      // Only persist guilds array, not loading/error states
      partialize: (state) => ({ guilds: state.guilds }),
    }
  )
);

