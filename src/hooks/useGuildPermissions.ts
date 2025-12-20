import { useEffect } from 'react';
import { usePermissionStore } from '../stores/permissionStore.ts';
import type { Permission } from '../types/permissions.ts';

/**
 * useGuildPermissions Hook - Composition: Compose store functionality
 * 
 * Hook that wraps permission store with auto-fetching on guild change.
 * Provides convenient interface for components.
 */
export function useGuildPermissions(guildId: string | null) {
  const fetchPermissions = usePermissionStore((state) => state.fetchPermissions);
  const isAdminFn = usePermissionStore((state) => state.isAdmin);
  const permissions = usePermissionStore((state) => state.permissions);
  const hasPermissionFn = usePermissionStore((state) => state.hasPermission);
  const loading = usePermissionStore((state) => state.loading);
  const error = usePermissionStore((state) => state.error);
  
  const isAdmin = guildId ? isAdminFn(guildId) : false;
  const isMember = guildId ? permissions[guildId]?.data.isMember : false;

  useEffect(() => {
    if (guildId) {
      fetchPermissions(guildId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  return {
    isAdmin,
    isMember,
    hasPermission: (permission: Permission) =>
      guildId ? hasPermissionFn(guildId, permission) : false,
    loading,
    error,
  };
}

