/**
 * Profile API
 * Handles all profile-related HTTP calls
 */

import { api } from './client.ts';
import type { AxiosRequestConfig } from 'axios';
import type { UserProfile, UserStats, UserSettings } from '../../types/index.ts';

export const profileApi = {
  getProfile: async (config?: AxiosRequestConfig): Promise<UserProfile> => {
    const response = await api.get('/api/profile', config);
    return response.data;
  },

  getStats: async (config?: AxiosRequestConfig): Promise<UserStats> => {
    const response = await api.get('/api/profile/stats', config);
    return response.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<void> => {
    await api.patch('/api/profile/settings', settings);
  },
};

