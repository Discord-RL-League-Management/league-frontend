import { create } from 'zustand';
import { permissionApi } from '../lib/api/permissions.ts';
import type { PermissionState, Permission } from '../types/permissions.ts';

interface PermissionCache {
  data: PermissionState;
  timestamp: number;
}

interface PermissionStore {
  permissions: Record<string, PermissionCache>;
  loading: boolean;
  error: string | null;
  pendingRequests: Record<string, Promise<void>>;

  fetchPermissions: (guildId: string) => Promise<void>;
  hasPermission: (guildId: string, permission: Permission) => boolean;
  isAdmin: (guildId: string) => boolean;
  clear: () => void;
}

const PERMISSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    if (!guildId || typeof guildId !== 'string' || guildId.trim() === '') {
      console.warn('fetchPermissions called with invalid guildId:', guildId);
      return;
    }

    const cached = get().permissions[guildId];
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < PERMISSION_CACHE_TTL) {
        return;
      }
    }
    
    const currentState = get();
    const existingRequest = currentState.pendingRequests[guildId];
    if (existingRequest) {
      return existingRequest;
    }

    let isAborted = false;

    const requestPromise = (async () => {
      try {
        if (isAborted) {
          return;
        }

        set({ loading: true, error: null });
        const permissionState = await permissionApi.getMyPermissions(guildId);
        
        if (isAborted) {
          return;
        }
        
        set((state) => ({
          permissions: {
            ...state.permissions,
            [guildId]: {
              data: permissionState,
              timestamp: Date.now(),
            },
          },
          loading: false,
        }));
      } catch (err: unknown) {
        if (isAborted) {
          return;
        }
        const errorData = (err as { response?: { data?: { message?: string } } })?.response?.data;
        const errorMessage = errorData?.message || 'Failed to load permissions';
        set({ error: errorMessage, loading: false });
        console.error('Error fetching permissions:', err);
      } finally {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [guildId]: _, ...rest } = state.pendingRequests;
          return { pendingRequests: rest };
        });
      }
    })();

    (requestPromise as Promise<void> & { abort?: () => void }).abort = () => {
      isAborted = true;
    };

    set((state) => ({
      pendingRequests: { ...state.pendingRequests, [guildId]: requestPromise },
    }));
    
    return requestPromise;
  },

  hasPermission: (guildId: string, permission: Permission): boolean => {
    const cached = get().permissions[guildId];
    if (!cached) return false;
    
    return cached.data.permissions.includes(permission);
  },

  isAdmin: (guildId: string): boolean => {
    const cached = get().permissions[guildId];
    if (!cached) return false;
    
    return cached.data.isAdmin;
  },

  clear: () => {
    set({ permissions: {}, error: null, pendingRequests: {} });
  },
}));

