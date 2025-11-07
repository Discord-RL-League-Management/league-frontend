/**
 * Profile API
 * Handles all profile-related HTTP calls
 */

import { api } from './client.ts';
import type { UserProfile, UserStats, UserSettings } from '../../types/index.ts';

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/api/profile');
    return response.data;
  },

  getStats: async (): Promise<UserStats> => {
    const response = await api.get('/api/profile/stats');
    return response.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<void> => {
    await api.patch('/api/profile/settings', settings);
  },
};

