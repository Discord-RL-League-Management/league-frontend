/**
 * Permission API - Single Responsibility: API calls only
 * 
 * Handles all permission-related HTTP requests.
 * No business logic, just API communication.
 */

import { api } from './client.ts';
import type { PermissionState } from '../../types/permissions.ts';

export const permissionApi = {
  getMyPermissions: async (guildId: string): Promise<PermissionState> => {
    const response = await api.get(`/api/guilds/${guildId}/permissions/me`);
    return response.data;
  },
};

