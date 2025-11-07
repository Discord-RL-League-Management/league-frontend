import { create } from 'zustand';
import { permissionApi } from '../lib/api/permissions.ts';
import type { PermissionState, Permission } from '../types/permissions.ts';

interface PermissionStore {
  permissions: Record<string, PermissionState>;
  loading: boolean;
  error: string | null;
  pendingRequests: Record<string, Promise<void>>;

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
  pendingRequests: {},

  fetchPermissions: async (guildId: string) => {
    // Return cached if exists
    if (get().permissions[guildId]) {
      return;
    }
    
    // Check if request already in-flight - do this atomically
    const currentState = get();
    const existingRequest = currentState.pendingRequests[guildId];
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request promise
    const requestPromise = (async () => {
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
      } finally {
        // Clean up pending request
        set((state) => {
          const { [guildId]: _, ...rest } = state.pendingRequests;
          return { pendingRequests: rest };
        });
      }
    })();

    // Track pending request atomically - use updater function to avoid race condition
    set((state) => ({
      pendingRequests: { ...state.pendingRequests, [guildId]: requestPromise },
    }));
    
    return requestPromise;
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
    set({ permissions: {}, error: null, pendingRequests: {} });
  },
}));

