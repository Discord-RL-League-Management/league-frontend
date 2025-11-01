import { useEffect } from 'react';
import { usePermissionStore } from '../stores/permissionStore';
import type { Permission } from '../types/permissions';

/**
 * useGuildPermissions Hook - Composition: Compose store functionality
 * 
 * Hook that wraps permission store with auto-fetching on guild change.
 * Provides convenient interface for components.
 */
export function useGuildPermissions(guildId: string | null) {
  const store = usePermissionStore();

  useEffect(() => {
    if (guildId) {
      store.fetchPermissions(guildId);
    }
  }, [guildId, store]);

  return {
    isAdmin: guildId ? store.isAdmin(guildId) : false,
    isMember: guildId ? store.permissions[guildId]?.isMember : false,
    hasPermission: (permission: Permission) =>
      guildId ? store.hasPermission(guildId, permission) : false,
    loading: store.loading,
    error: store.error,
  };
}

