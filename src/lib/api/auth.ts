/**
 * Authentication API
 * Handles all authentication-related HTTP calls
 */

import { api } from './client.ts';
import type { User } from '../../types/index.ts';
import { navigate } from '../navigation.ts';

export const authApi = {
  login: () => {
    // Redirect to Discord OAuth (external URL, so window.location is appropriate)
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
    // Use React Router navigation instead of window.location
    navigate('/', { replace: true });
  },
};

