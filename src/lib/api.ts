import axios, { AxiosError, type AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies for HttpOnly JWT storage
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = '/login';
    }
    
    // Transform error for consistent handling
    const transformedError = {
      message: (error.response?.data as any)?.message || error.message || 'Network error',
      code: (error.response?.data as any)?.code,
      details: (error.response?.data as any)?.details,
      status: error.response?.status,
    };

    return Promise.reject(transformedError);
  }
);

export interface User {
  id: string;
  username: string;
  discriminator?: string;
  globalName?: string;
  avatar?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
  email?: string;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface UserSettings {
  notifications: boolean;
  theme: string;
}

export interface Guild {
  id: string;
  name: string;
  icon?: string;
  roles: string[];
}

export interface GuildDetails extends Guild {
  settings?: any;
  members?: any[];
}

/**
 * Authentication API - Single responsibility: Auth-related HTTP calls
 */
export const authApi = {
  login: () => {
    // Redirect to Discord OAuth
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

/**
 * Profile API - Single responsibility: Profile-related HTTP calls
 */
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

/**
 * Guild API - Single responsibility: Guild-related HTTP calls
 */
export const guildApi = {
  getMyGuilds: async (): Promise<Guild[]> => {
    const response = await api.get('/api/guilds/my-guilds');
    return response.data;
  },

  getGuild: async (guildId: string): Promise<GuildDetails> => {
    const response = await api.get(`/api/guilds/${guildId}`);
    return response.data;
  },

  getGuildSettings: async (guildId: string) => {
    const response = await api.get(`/api/guilds/${guildId}/settings`);
    return response.data;
  },

  updateGuildSettings: async (guildId: string, settings: any) => {
    const response = await api.patch(`/api/guilds/${guildId}/settings`, settings);
    return response.data;
  },
};

export default api;
