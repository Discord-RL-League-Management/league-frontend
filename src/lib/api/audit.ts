/**
 * Audit API - Single Responsibility: API calls only
 * 
 * Handles all audit log-related HTTP requests.
 * No business logic, just API communication.
 */

import { api } from './client.ts';
import type {
  AuditLog,
  AuditLogFilters,
  PaginatedResult,
} from '../../types/permissions.ts';

export const auditApi = {
  getGuildAuditLogs: async (
    guildId: string,
    filters?: AuditLogFilters
  ): Promise<PaginatedResult<AuditLog>> => {
    const response = await api.get(`/api/guilds/${guildId}/audit-logs`, {
      params: filters,
    });
    return response.data;
  },
};

