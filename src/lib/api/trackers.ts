/**
 * Tracker API
 * Handles all tracker registration-related HTTP calls
 */

import { api } from './client.ts';
import type { TrackerRegistration, Tracker, QueueStats } from '../../types/trackers.ts';

export const trackerApi = {
  /**
   * Get next pending registration for a guild
   * @param guildId - Discord guild ID
   * @returns Next pending registration or null if none found
   */
  getNextRegistration: async (guildId: string): Promise<TrackerRegistration | null> => {
    try {
      const response = await api.get(`/api/trackers/queue/${guildId}/next`);
      return response.data;
    } catch (error: any) {
      // Handle 404 gracefully (no pending registrations)
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get registration by ID
   * @param registrationId - Registration ID
   * @returns Registration details
   */
  getRegistration: async (registrationId: string): Promise<TrackerRegistration> => {
    const response = await api.get(`/api/trackers/queue/${registrationId}`);
    return response.data;
  },

  /**
   * Get registration by username for a guild
   * @param guildId - Discord guild ID
   * @param username - Discord username
   * @returns Registration or null if not found
   */
  getRegistrationByUser: async (guildId: string, username: string): Promise<TrackerRegistration | null> => {
    try {
      const response = await api.get(`/api/trackers/queue/${guildId}/user/${username}`);
      return response.data;
    } catch (error: any) {
      // Handle 404 gracefully
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get queue statistics for a guild
   * @param guildId - Discord guild ID
   * @returns Queue statistics
   */
  getQueueStats: async (guildId: string): Promise<QueueStats> => {
    const response = await api.get(`/api/trackers/queue/${guildId}/stats`);
    return response.data;
  },

  /**
   * Process a registration (approve)
   * @param registrationId - Registration ID
   * @param displayName - Optional display name for the tracker
   * @returns Updated registration
   */
  processRegistration: async (
    registrationId: string,
    displayName?: string
  ): Promise<TrackerRegistration> => {
    const response = await api.post(`/api/trackers/queue/${registrationId}/process`, {
      displayName,
    });
    return response.data;
  },

  /**
   * Reject a registration
   * @param registrationId - Registration ID
   * @param reason - Reason for rejection
   * @returns Updated registration
   */
  rejectRegistration: async (registrationId: string, reason: string): Promise<TrackerRegistration> => {
    const response = await api.post(`/api/trackers/queue/${registrationId}/reject`, {
      reason,
    });
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





