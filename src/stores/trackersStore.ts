import { create } from 'zustand';
import { trackerApi } from '../lib/api/trackers.ts';
import type { Tracker, TrackerDetail, ScrapingStatus } from '../types/trackers.ts';

/**
 * Trackers Store State
 */
interface TrackersState {
  trackers: Tracker[];
  selectedTracker: Tracker | null;
  myTracker: Tracker | null;
  trackerDetail: TrackerDetail | null;
  scrapingStatus: ScrapingStatus | null;
  loading: boolean;
  error: string | null;

  // Methods
  fetchTrackers: (guildId?: string) => Promise<void>;
  getTracker: (id: string) => Promise<void>;
  registerTracker: (url: string) => Promise<void>;
  getMyTracker: () => Promise<void>;
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
  myTracker: null,
  trackerDetail: null,
  scrapingStatus: null,
  loading: false,
  error: null,

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
      
      // Remove from trackers list
      set((state) => ({
        trackers: state.trackers.filter((t) => t.id !== id),
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
   * Register a new tracker
   */
  registerTracker: async (url: string) => {
    try {
      set({ error: null, loading: true });
      const tracker = await trackerApi.registerTracker(url);
      set({ myTracker: tracker, loading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to register tracker';
      set({ error: errorMessage, loading: false });
      throw err;
    }
  },

  /**
   * Get current user's tracker
   */
  getMyTracker: async () => {
    try {
      set({ error: null, loading: true });
      const tracker = await trackerApi.getMyTracker();
      set({ myTracker: tracker, loading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tracker';
      set({ error: errorMessage, loading: false });
      console.error('Error fetching my tracker:', err);
    }
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


