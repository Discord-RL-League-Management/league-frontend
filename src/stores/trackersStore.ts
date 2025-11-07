import { create } from 'zustand';
import { trackerApi } from '../lib/api/trackers.ts';
import type { Tracker } from '../types/trackers.ts';

/**
 * Trackers Store State
 */
interface TrackersState {
  trackers: Tracker[];
  selectedTracker: Tracker | null;
  loading: boolean;
  error: string | null;

  // Methods
  fetchTrackers: (guildId?: string) => Promise<void>;
  getTracker: (id: string) => Promise<void>;
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
   * Clear selected tracker
   */
  clearSelectedTracker: () => {
    set({ selectedTracker: null });
  },
}));


