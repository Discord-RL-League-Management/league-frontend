import { create } from 'zustand';
import { permissionApi } from '../lib/api/permissions';
import type { PermissionState, Permission } from '../types/permissions';

interface PermissionStore {
  permissions: Record<string, PermissionState>;
  loading: boolean;
  error: string | null;

  fetchPermissions: (guildId: string) => Promise<void>;
  hasPermission: (guildId: string, permission: Permission) => boolean;
  isAdmin: (guildId: string) => boolean;
  clear: () => void;
}

/**
 * Permission Store - Centralized state management
 * 
 * Manages permission state per guild ID.
 */
export const usePermissionStore = create<PermissionStore>((set, get) => ({
  permissions: {},
  loading: false,
  error: null,

  fetchPermissions: async (guildId: string) => {
    // Return cached if exists
    if (get().permissions[guildId]) {
      return;
    }

    try {
      set({ loading: true, error: null });
      const permissionState = await permissionApi.getMyPermissions(guildId);
      
      set((state) => ({
        permissions: {
          ...state.permissions,
          [guildId]: permissionState,
        },
        loading: false,
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load permissions';
      set({ error: errorMessage, loading: false });
      console.error('Error fetching permissions:', err);
    }
  },

  hasPermission: (guildId: string, permission: Permission): boolean => {
    const state = get().permissions[guildId];
    if (!state) return false;
    
    return state.permissions.includes(permission);
  },

  isAdmin: (guildId: string): boolean => {
    const state = get().permissions[guildId];
    if (!state) return false;
    
    return state.isAdmin;
  },

  clear: () => {
    set({ permissions: {}, error: null });
  },
}));

