import { create } from 'zustand';
import { trackerApi } from '../lib/api/trackers.ts';
import type { TrackerRegistration, QueueStats } from '../types/trackers.ts';

/**
 * Registrations Store State
 */
interface RegistrationsState {
  currentRegistration: TrackerRegistration | null;
  queueStats: QueueStats | null;
  loading: boolean;
  error: string | null;
  pendingRequests: Record<string, Promise<void>>;

  // Methods
  fetchNextRegistration: (guildId: string) => Promise<void>;
  fetchQueueStats: (guildId: string) => Promise<void>;
  processRegistration: (registrationId: string, displayName?: string) => Promise<void>;
  rejectRegistration: (registrationId: string, reason: string) => Promise<void>;
  clearCurrentRegistration: () => void;
  retry: (guildId: string) => Promise<void>;
}

/**
 * Registrations Store - Centralized state management with request deduplication
 * 
 * Features:
 * - Request deduplication: Prevents duplicate API calls
 * - Atomic state updates: Prevents race conditions
 * - Optimistic updates: Updates UI immediately, refetches stats
 * - Graceful error handling: Handles 404 for no pending registrations
 */
export const useRegistrationsStore = create<RegistrationsState>((set, get) => ({
  currentRegistration: null,
  queueStats: null,
  loading: false,
  error: null,
  pendingRequests: {},

  /**
   * Fetch next pending registration for a guild
   * Handles 404 gracefully (no pending registrations)
   */
  fetchNextRegistration: async (guildId: string) => {
    const requestKey = `next-${guildId}`;

    // Check if request already in-flight
    const existingRequest = get().pendingRequests[requestKey];
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request promise
    const requestPromise = (async () => {
      try {
        set({ error: null, loading: true });

        const registration = await trackerApi.getNextRegistration(guildId);

        // Handle 404 gracefully (no pending registrations)
        if (!registration) {
          set({
            currentRegistration: null,
            loading: false,
          });
          return;
        }

        set({
          currentRegistration: registration,
          loading: false,
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch next registration';
        set({ error: errorMessage, loading: false });
        console.error('Error fetching next registration:', err);
      } finally {
        // Clean up pending request
        set((state) => {
          const { [requestKey]: _, ...rest } = state.pendingRequests;
          return { pendingRequests: rest };
        });
      }
    })();

    // Track pending request atomically
    set((state) => ({
      pendingRequests: { ...state.pendingRequests, [requestKey]: requestPromise },
    }));

    return requestPromise;
  },

  /**
   * Fetch queue statistics for a guild
   * Caches stats and deduplicates requests
   */
  fetchQueueStats: async (guildId: string) => {
    const requestKey = `stats-${guildId}`;

    // Check if request already in-flight
    const existingRequest = get().pendingRequests[requestKey];
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request promise
    const requestPromise = (async () => {
      try {
        // Only set loading if we don't have cached stats
        if (!get().queueStats) {
          set({ error: null, loading: true });
        }

        const stats = await trackerApi.getQueueStats(guildId);

        set({
          queueStats: stats,
          loading: false,
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch queue stats';
        set({ error: errorMessage, loading: false });
        console.error('Error fetching queue stats:', err);
      } finally {
        // Clean up pending request
        set((state) => {
          const { [requestKey]: _, ...rest } = state.pendingRequests;
          return { pendingRequests: rest };
        });
      }
    })();

    // Track pending request atomically
    set((state) => ({
      pendingRequests: { ...state.pendingRequests, [requestKey]: requestPromise },
    }));

    return requestPromise;
  },

  /**
   * Process a registration (approve)
   * Optimistic update: clears current registration and refetches stats
   */
  processRegistration: async (registrationId: string, displayName?: string) => {
    try {
      set({ error: null, loading: true });

      // Get guildId before clearing current registration
      const currentGuildId = get().currentRegistration?.guildId;

      await trackerApi.processRegistration(registrationId, displayName);

      // Clear current registration
      set({ currentRegistration: null });
      
      // Refetch stats to update counts
      if (currentGuildId) {
        await get().fetchQueueStats(currentGuildId);
      }

      set({ loading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process registration';
      set({ error: errorMessage, loading: false });
      throw err;
    }
  },

  /**
   * Reject a registration
   * Optimistic update: clears current registration and refetches stats
   */
  rejectRegistration: async (registrationId: string, reason: string) => {
    try {
      set({ error: null, loading: true });

      // Get guildId before clearing current registration
      const currentGuildId = get().currentRegistration?.guildId;

      await trackerApi.rejectRegistration(registrationId, reason);

      // Clear current registration
      set({ currentRegistration: null });

      // Refetch stats to update counts
      if (currentGuildId) {
        await get().fetchQueueStats(currentGuildId);
      }

      set({ loading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reject registration';
      set({ error: errorMessage, loading: false });
      throw err;
    }
  },

  /**
   * Clear current registration
   */
  clearCurrentRegistration: () => {
    set({ currentRegistration: null });
  },

  /**
   * Retry failed operations
   */
  retry: async (guildId: string) => {
    set({ error: null, loading: true });
    await Promise.all([
      get().fetchQueueStats(guildId),
      get().fetchNextRegistration(guildId),
    ]);
  },
}));

