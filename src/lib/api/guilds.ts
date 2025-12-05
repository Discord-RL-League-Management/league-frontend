/**
 * Guild API
 * Handles all guild-related HTTP calls
 */

import { api } from './client.ts';
import type { AxiosRequestConfig } from 'axios';
import type { Guild, GuildDetails, GuildSettingsType, DiscordChannel, DiscordRole } from '../../types/index.ts';

export const guildApi = {
  getMyGuilds: async (): Promise<Guild[]> => {
    const response = await api.get('/auth/guilds');
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
  getGuildChannels: async (guildId: string): Promise<DiscordChannel[]> => {
    const response = await api.get(`/api/guilds/${guildId}/channels`);
    return response.data;
  },

  // NEW: Get guild roles from Discord API
  getGuildRoles: async (guildId: string, config?: AxiosRequestConfig): Promise<DiscordRole[]> => {
    const response = await api.get(`/api/guilds/${guildId}/roles`, config);
    return response.data;
  },

  /**
   * Get guild members with pagination
   */
  getGuildMembers: async (guildId: string, page: number = 1, limit: number = 20): Promise<any> => {
    const response = await api.get(`/api/guilds/${guildId}/members`, {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get specific guild member
   */
  getGuildMember: async (guildId: string, userId: string, config?: AxiosRequestConfig): Promise<any> => {
    const response = await api.get(`/api/guilds/${guildId}/members/${userId}`, config);
    return response.data;
  },

  /**
   * Search guild members
   */
  searchGuildMembers: async (guildId: string, query: string, page: number = 1, limit: number = 20): Promise<any> => {
    const response = await api.get(`/api/guilds/${guildId}/members/search`, {
      params: { q: query, page, limit },
    });
    return response.data;
  },

  /**
   * Get guild member statistics
   */
  getMemberStats: async (guildId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    newThisWeek: number;
  }> => {
    const response = await api.get(`/api/guilds/${guildId}/members/stats`);
    return response.data;
  },
};
