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
  // Hooks must be called unconditionally - move all hooks outside conditionals
  const fetchPermissions = usePermissionStore((state) => state.fetchPermissions);
  const isAdminFn = usePermissionStore((state) => state.isAdmin);
  const permissions = usePermissionStore((state) => state.permissions);
  const hasPermissionFn = usePermissionStore((state) => state.hasPermission);
  const loading = usePermissionStore((state) => state.loading);
  const error = usePermissionStore((state) => state.error);
  
  // Compute derived values after hooks are called
  const isAdmin = guildId ? isAdminFn(guildId) : false;
  const isMember = guildId ? permissions[guildId]?.isMember : false;

  useEffect(() => {
    if (guildId) {
      fetchPermissions(guildId);
    }
    // Only depend on guildId - fetchPermissions from Zustand store is stable
    // and doesn't need to be in dependencies
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

