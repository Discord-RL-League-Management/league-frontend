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
 * Now uses ActivityLog from backend (generic activity logging)
 */
export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  eventType: string;
  action: string;
  userId?: string | null;
  guildId?: string | null;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: string;
  // Computed fields for display
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










