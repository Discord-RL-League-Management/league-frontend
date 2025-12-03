import { create } from 'zustand';
import { trackerApi } from '../lib/api/trackers.ts';
import type { Tracker, TrackerDetail, ScrapingStatus } from '../types/trackers.ts';

/**
 * Trackers Store State
 */
interface TrackersState {
  trackers: Tracker[];
  selectedTracker: Tracker | null;
  myTrackers: Tracker[];
  trackerDetail: TrackerDetail | null;
  scrapingStatus: ScrapingStatus | null;
  loading: boolean;
  error: string | null;
  myTrackersLastFetched: number | null; // Timestamp of last successful fetch
  myTrackersRequestInFlight: Promise<void> | null; // Track in-flight request

  // Methods
  fetchTrackers: (guildId?: string) => Promise<void>;
  getTracker: (id: string) => Promise<void>;
  registerTrackers: (urls: string[]) => Promise<void>;
  addTracker: (url: string) => Promise<void>;
  getMyTrackers: (force?: boolean) => Promise<void>;
  getTrackerDetail: (trackerId: string) => Promise<void>;
  refreshTracker: (trackerId: string) => Promise<void>;
  getScrapingStatus: (trackerId: string) => Promise<void>;
  updateTracker: (id: string, data: { displayName?: string; isActive?: boolean }) => Promise<void>;
  deleteTracker: (id: string) => Promise<void>;
  clearError: () => void;
  clearSelectedTracker: () => void;
}

/**
 * Trackers Store - Centralized state management for trackers
 */
export const useTrackersStore = create<TrackersState>((set, get) => ({
  trackers: [],
  selectedTracker: null,
  myTrackers: [],
  trackerDetail: null,
  scrapingStatus: null,
  loading: false,
  error: null,
  myTrackersLastFetched: null,
  myTrackersRequestInFlight: null,

  /**
   * Fetch trackers for a guild or all user trackers
   */
  fetchTrackers: async (guildId?: string) => {
    try {
      set({ error: null, loading: true });
      const trackers = await trackerApi.getTrackers(guildId);
      set({ trackers, loading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch trackers';
      set({ error: errorMessage, loading: false });
      console.error('Error fetching trackers:', err);
    }
  },

  /**
   * Get a specific tracker by ID
   */
  getTracker: async (id: string) => {
    try {
      set({ error: null, loading: true });
      const tracker = await trackerApi.getTracker(id);
      set({ selectedTracker: tracker, loading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tracker';
      set({ error: errorMessage, loading: false });
      console.error('Error fetching tracker:', err);
    }
  },

  /**
   * Update tracker metadata
   */
  updateTracker: async (id: string, data: { displayName?: string; isActive?: boolean }) => {
    try {
      set({ error: null, loading: true });
      const updated = await trackerApi.updateTracker(id, data);
      
      // Update in trackers list
      set((state) => ({
        trackers: state.trackers.map((t) => (t.id === id ? updated : t)),
        selectedTracker: state.selectedTracker?.id === id ? updated : state.selectedTracker,
        loading: false,
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update tracker';
      set({ error: errorMessage, loading: false });
      throw err;
    }
  },

  /**
   * Delete a tracker (soft delete)
   */
  deleteTracker: async (id: string) => {
    try {
      set({ error: null, loading: true });
      await trackerApi.deleteTracker(id);
      
      // Remove from trackers list and myTrackers
      set((state) => ({
        trackers: state.trackers.filter((t) => t.id !== id),
        myTrackers: state.myTrackers.filter((t) => t.id !== id),
        selectedTracker: state.selectedTracker?.id === id ? null : state.selectedTracker,
        loading: false,
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete tracker';
      set({ error: errorMessage, loading: false });
      throw err;
    }
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Register multiple trackers (1-4) for new users
   */
  registerTrackers: async (urls: string[]) => {
    try {
      set({ error: null, loading: true });
      const trackers = await trackerApi.registerTrackers(urls);
      set({ myTrackers: trackers, loading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to register trackers';
      set({ error: errorMessage, loading: false });
      throw err;
    }
  },

  /**
   * Add an additional tracker (up to 4 total)
   */
  addTracker: async (url: string) => {
    try {
      set({ error: null, loading: true });
      const tracker = await trackerApi.addTracker(url);
      set((state) => ({ 
        myTrackers: [...state.myTrackers, tracker],
        loading: false 
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add tracker';
      set({ error: errorMessage, loading: false });
      throw err;
    }
  },

  /**
   * Get current user's trackers
   * @param force - If true, bypasses cache and makes a fresh request
   */
  getMyTrackers: async (force = false) => {
    const state = get();
    
    // If there's already a request in flight, wait for it instead of making a new one
    if (state.myTrackersRequestInFlight && !force) {
      return state.myTrackersRequestInFlight;
    }

    // If we have recent data (within last 30 seconds) and not forcing, use cache
    const CACHE_TTL = 30000; // 30 seconds
    if (
      !force &&
      state.myTrackersLastFetched &&
      Date.now() - state.myTrackersLastFetched < CACHE_TTL &&
      state.myTrackers.length > 0
    ) {
      return Promise.resolve();
    }

    // Create promise with resolve/reject handlers
    // This MUST be set synchronously to prevent race conditions
    let resolveFn: (() => void) | undefined;
    let rejectFn: ((err: any) => void) | undefined;
    const requestPromise = new Promise<void>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });

    // CRITICAL: Set in-flight flag SYNCHRONOUSLY before any async work
    // This prevents race conditions when multiple components call this simultaneously
    set({ myTrackersRequestInFlight: requestPromise });

    // Now execute the actual async fetch
    (async () => {
      try {
        set({ error: null, loading: true });
        const trackers = await trackerApi.getMyTrackers();
        set({
          myTrackers: trackers,
          loading: false,
          myTrackersLastFetched: Date.now(),
          myTrackersRequestInFlight: null,
        });
        resolveFn?.();
      } catch (err: any) {
        // Don't retry on rate limit (429) errors - prevent infinite loops
        if (err.status === 429 || err.response?.status === 429) {
          const errorMessage = 'Too many requests. Please wait a moment before trying again.';
          set({
            error: errorMessage,
            loading: false,
            myTrackersRequestInFlight: null,
          });
          console.error('Rate limited - stopping retries:', err);
          rejectFn?.(err);
          return;
        }
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch trackers';
        set({
          error: errorMessage,
          loading: false,
          myTrackersRequestInFlight: null,
        });
        console.error('Error fetching my trackers:', err);
        rejectFn?.(err);
      }
    })();

    return requestPromise;
  },

  /**
   * Get tracker detail with all seasons
   */
  getTrackerDetail: async (trackerId: string) => {
    try {
      set({ error: null, loading: true });
      const detail = await trackerApi.getTrackerDetail(trackerId);
      set({ trackerDetail: detail, loading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tracker detail';
      set({ error: errorMessage, loading: false });
      console.error('Error fetching tracker detail:', err);
    }
  },

  /**
   * Refresh tracker data (trigger scraping)
   */
  refreshTracker: async (trackerId: string) => {
    try {
      set({ error: null, loading: true });
      await trackerApi.refreshTracker(trackerId);
      // Refresh the tracker detail after refresh is triggered
      await get().getTrackerDetail(trackerId);
      set({ loading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to refresh tracker';
      set({ error: errorMessage, loading: false });
      throw err;
    }
  },

  /**
   * Get scraping status for a tracker
   */
  getScrapingStatus: async (trackerId: string) => {
    try {
      set({ error: null });
      const status = await trackerApi.getScrapingStatus(trackerId);
      set({ scrapingStatus: status });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch scraping status';
      set({ error: errorMessage });
      console.error('Error fetching scraping status:', err);
    }
  },

  /**
   * Clear selected tracker
   */
  clearSelectedTracker: () => {
    set({ selectedTracker: null });
  },
}));


