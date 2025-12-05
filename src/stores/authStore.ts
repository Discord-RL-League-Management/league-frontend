import { create } from 'zustand';
import { authApi } from '../lib/api/index.ts';
import type { User } from '../types/index.ts';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  retry: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  login: () => {
    authApi.login();
  },

  logout: () => {
    set({ user: null, error: null });
    authApi.logout();
  },

  fetchUser: async () => {
    try {
      set({ loading: true, error: null });
      const userData = await authApi.getCurrentUser();
      set({ user: userData, loading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load user data';
      set({ error: errorMessage, loading: false });
      console.error('Error fetching user:', err);
    }
  },

  retry: () => {
    set({ loading: true, error: null });
    const store = useAuthStore.getState();
    store.fetchUser().catch((err) => {
      // Error is already handled in fetchUser, but we catch to prevent unhandled rejection
      console.error('Error in retry:', err);
    });
  },
}));

