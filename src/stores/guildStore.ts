import { create } from 'zustand';
import { guildApi } from '../lib/api';
import type { Guild } from '../types';

interface GuildState {
  guilds: Guild[];
  selectedGuild: Guild | null;
  loading: boolean;
  error: string | null;
  fetchGuilds: () => Promise<void>;
  setSelectedGuild: (guild: Guild | null) => void;
  retry: () => void;
}

export const useGuildStore = create<GuildState>((set) => ({
  guilds: [],
  selectedGuild: null,
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

  setSelectedGuild: (guild: Guild | null) => {
    set({ selectedGuild: guild });
  },

  retry: () => {
    const store = useGuildStore.getState();
    store.fetchGuilds();
  },
}));

