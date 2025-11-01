import React from 'react';
import { useGuildPermissions } from '../hooks/useGuildPermissions';
import { LoadingState } from './loading-state';
import type { Permission } from '../types/permissions';

/**
 * PermissionGuard Component - Reusability: Single component for all permission checks
 * 
 * Conditionally renders children based on user permissions.
 * Supports admin check and specific permission checks.
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

