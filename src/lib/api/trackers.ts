/**
 * Tracker API
 * Handles all tracker-related HTTP calls
 */

import { api } from './client.ts';
import type { Tracker, TrackerDetail, ScrapingStatus } from '../../types/trackers.ts';

export const trackerApi = {
  /**
   * Register multiple tracker URLs (1-4) for new users
   * @param urls - Array of tracker URLs
   * @returns Array of registered trackers
   */
  registerTrackers: async (urls: string[]): Promise<Tracker[]> => {
    const response = await api.post('/api/trackers/register', { urls });
    return response.data;
  },

  /**
   * Add an additional tracker URL (up to 4 total)
   * @param url - Tracker URL
   * @returns Added tracker
   */
  addTracker: async (url: string): Promise<Tracker> => {
    const response = await api.post('/api/trackers/add', { url });
    return response.data;
  },

  /**
   * Get current user's trackers
   * @returns Array of user's trackers or empty array if none
   */
  getMyTrackers: async (): Promise<Tracker[]> => {
    try {
      const response = await api.get('/api/trackers/me');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      // Handle 404 gracefully (no trackers)
      if (error.response?.status === 404 || error.status === 404) {
        return [];
      }
      // Don't retry on rate limit - let the error propagate so the store can handle it
      if (error.response?.status === 429 || error.status === 429) {
        throw error; // Re-throw to let store handle it
      }
      throw error;
    }
  },

  /**
   * Get tracker detail with all seasons
   * @param trackerId - Tracker ID
   * @returns Tracker detail with seasons
   */
  getTrackerDetail: async (trackerId: string): Promise<TrackerDetail> => {
    const response = await api.get(`/api/trackers/${trackerId}/detail`);
    return response.data;
  },

  /**
   * Get scraping status for a tracker
   * @param trackerId - Tracker ID
   * @returns Scraping status
   */
  getScrapingStatus: async (trackerId: string): Promise<ScrapingStatus> => {
    const response = await api.get(`/api/trackers/${trackerId}/status`);
    return response.data;
  },

  /**
   * Refresh tracker data (trigger scraping)
   * @param trackerId - Tracker ID
   * @returns Success message
   */
  refreshTracker: async (trackerId: string): Promise<{ message: string }> => {
    const response = await api.post(`/api/trackers/${trackerId}/refresh`);
    return response.data;
  },

  /**
   * Get trackers (filtered by guild if provided)
   * @param guildId - Optional Discord guild ID
   * @returns List of trackers
   */
  getTrackers: async (guildId?: string): Promise<Tracker[]> => {
    const params = guildId ? { guildId } : {};
    const response = await api.get('/api/trackers', { params });
    return response.data;
  },

  /**
   * Get tracker details by ID
   * @param id - Tracker ID
   * @returns Tracker details
   */
  getTracker: async (id: string): Promise<Tracker> => {
    const response = await api.get(`/api/trackers/${id}`);
    return response.data;
  },

  /**
   * Update tracker metadata
   * @param id - Tracker ID
   * @param data - Update data (displayName, isActive)
   * @returns Updated tracker
   */
  updateTracker: async (
    id: string,
    data: { displayName?: string; isActive?: boolean }
  ): Promise<Tracker> => {
    const response = await api.put(`/api/trackers/${id}`, data);
    return response.data;
  },

  /**
   * Soft delete a tracker
   * @param id - Tracker ID
   */
  deleteTracker: async (id: string): Promise<void> => {
    await api.delete(`/api/trackers/${id}`);
  },
};





