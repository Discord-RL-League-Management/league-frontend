/**
 * Guild API
 * Handles all guild-related HTTP calls
 */

import { api } from './client';
import type { Guild, GuildDetails, GuildSettingsType } from '../../types';

export const guildApi = {
  getMyGuilds: async (): Promise<Guild[]> => {
    const response = await api.get('/api/guilds/my-guilds');
    return response.data;
  },

  getGuild: async (guildId: string): Promise<GuildDetails> => {
    const response = await api.get(`/api/guilds/${guildId}`);
    return response.data;
  },

  getGuildSettings: async (guildId: string): Promise<GuildSettingsType> => {
    const response = await api.get(`/api/guilds/${guildId}/settings`);
    return response.data;
  },

  updateGuildSettings: async (guildId: string, settings: Partial<GuildSettingsType>): Promise<GuildSettingsType> => {
    const response = await api.patch(`/api/guilds/${guildId}/settings`, settings);
    return response.data;
  },

  resetGuildSettings: async (guildId: string): Promise<void> => {
    const response = await api.post(`/api/guilds/${guildId}/settings/reset`);
    return response.data;
  },

  getSettingsHistory: async (guildId: string, limit: number = 50): Promise<any> => {
    const response = await api.get(`/api/guilds/${guildId}/settings/history`, {
      params: { limit },
    });
    return response.data;
  },

  // NEW: Get guild channels from Discord API
  getGuildChannels: async (guildId: string): Promise<any[]> => {
    const response = await api.get(`/api/guilds/${guildId}/channels`);
    return response.data;
  },

  // NEW: Get guild roles from Discord API
  getGuildRoles: async (guildId: string): Promise<any[]> => {
    const response = await api.get(`/api/guilds/${guildId}/roles`);
    return response.data;
  },
};
