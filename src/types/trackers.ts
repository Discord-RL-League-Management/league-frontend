/**
 * Tracker Type Definitions
 * Types for tracker registration and processing
 */

import type { User } from './user.ts';

/**
 * Game platform types
 */
export type GamePlatform = 'STEAM' | 'EPIC' | 'XBL' | 'PSN' | 'SWITCH';

/**
 * Game types
 */
export type Game = 'ROCKET_LEAGUE';

/**
 * Tracker registration status types
 */
export type TrackerRegistrationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';

/**
 * Tracker registration interface matching API response
 */
export interface TrackerRegistration {
  id: string;
  userId: string;
  guildId: string;
  url: string;
  status: TrackerRegistrationStatus;
  game?: Game;
  platform?: GamePlatform;
  username?: string;
  displayName?: string;
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  jobId?: string;
  user: User;
  guild: {
    id: string;
    name: string;
  };
  processedByUser?: User;
  tracker?: {
    id: string;
    url: string;
    game: Game;
    platform: GamePlatform;
    username: string;
  };
}

/**
 * Tracker interface
 */
export interface Tracker {
  id: string;
  url: string;
  game: Game;
  platform: GamePlatform;
  username: string;
  userId: string;
  displayName?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  snapshots?: TrackerSnapshot[];
}

/**
 * Tracker snapshot interface
 */
export interface TrackerSnapshot {
  id: string;
  trackerId: string;
  capturedAt: string;
  seasonNumber?: number;
  enteredBy: string;
  ones?: number;
  twos?: number;
  threes?: number;
  fours?: number;
  onesGamesPlayed?: number;
  twosGamesPlayed?: number;
  threesGamesPlayed?: number;
  foursGamesPlayed?: number;
}

/**
 * Queue statistics interface
 */
export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  rejected: number;
  failed: number;
}



