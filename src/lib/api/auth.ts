/**
 * Authentication API
 * Handles all authentication-related HTTP calls
 */

import { api } from './client.ts';
import type { User } from '../../types/index.ts';

export const authApi = {
  login: () => {
    // Redirect to Discord OAuth
    const API_URL = import.meta.env.VITE_API_URL;
    window.location.href = `${API_URL}/auth/discord`;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    window.location.href = '/';
  },
};

