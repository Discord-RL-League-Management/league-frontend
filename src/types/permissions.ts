/**
 * Permission Types - Type Safety for extensibility
 * 
 * Centralized permission type definitions for consistency across frontend.
 */

/**
 * Permission State - Complete permission information for a user in a guild
 */
export interface PermissionState {
  isMember: boolean;
  isAdmin: boolean;
  permissions: string[];
  roles: string[];
}

/**
 * Permission - Specific permission types
 * 
 * Extensible enum-like type for adding new permissions
 */
export type Permission =
  | 'create_leagues'
  | 'manage_teams'
  | 'view_stats'
  | 'manage_tournaments'
  | 'manage_roles'
  | 'view_logs';

/**
 * Audit Log - Single audit log entry
 */
export interface AuditLog {
  id: string;
  userId: string | null;
  guildId: string | null;
  action: string;
  resource: string;
  result: 'allowed' | 'denied';
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    globalName: string | null;
  };
}

/**
 * Audit Log Filters - Filter options for querying audit logs
 */
export interface AuditLogFilters {
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Paginated Result - Generic pagination wrapper
 */
export interface PaginatedResult<T> {
  logs: T[];
  total: number;
  limit: number;
  offset: number;
}

