import React from 'react';
import { useGuildPermissions } from '../hooks/useGuildPermissions.ts';
import { LoadingState } from './loading-state.tsx';
import type { Permission } from '../types/permissions.ts';

/**
 * PermissionGuard Component - Reusability: Single component for all permission checks
 * 
 * Conditionally renders children based on user permissions.
 * Supports admin check and specific permission checks.
 * 
 * Note: Uses useGuildPermissions hook which includes request deduplication,
 * so multiple PermissionGuard instances won't cause duplicate API calls.
 */
interface PermissionGuardProps {
  guildId: string;
  requiredPermission?: Permission;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  guildId,
  requiredPermission,
  requireAdmin,
  fallback = null,
  children,
}: PermissionGuardProps) {
  // useGuildPermissions handles deduplication - if parent already fetched,
  // it will use cached data or pending request, not trigger duplicate fetch
  const { isAdmin, hasPermission, loading } = useGuildPermissions(guildId);

  if (loading) {
    return <LoadingState />;
  }

  if (requireAdmin && !isAdmin) {
    return <>{fallback}</>;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

