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
  // Zustand stores are stable - don't include in dependency arrays
  // Use selector pattern to get only what we need for reactivity
  const fetchPermissions = usePermissionStore((state) => state.fetchPermissions);
  const isAdmin = guildId ? usePermissionStore((state) => state.isAdmin(guildId)) : false;
  const isMember = guildId ? usePermissionStore((state) => state.permissions[guildId]?.isMember) : false;
  const hasPermissionFn = usePermissionStore((state) => state.hasPermission);
  const loading = usePermissionStore((state) => state.loading);
  const error = usePermissionStore((state) => state.error);

  useEffect(() => {
    if (guildId) {
      fetchPermissions(guildId);
    }
    // Only depend on guildId and fetchPermissions function
    // fetchPermissions from Zustand store is stable
  }, [guildId, fetchPermissions]);

  return {
    isAdmin,
    isMember,
    hasPermission: (permission: Permission) =>
      guildId ? hasPermissionFn(guildId, permission) : false,
    loading,
    error,
  };
}

