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
 * Tracker scraping status types
 */
export type TrackerScrapingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

/**
 * Playlist data interface
 */
export interface PlaylistData {
  rank: string | null;
  rankValue: number | null;
  division: string | null;
  divisionValue: number | null;
  rating: number | null; // MMR
  matchesPlayed: number | null;
  winStreak: number | null;
}

/**
 * Tracker season interface
 */
export interface TrackerSeason {
  id: string;
  trackerId: string;
  seasonNumber: number;
  seasonName: string | null;
  playlist1v1: PlaylistData | null;
  playlist2v2: PlaylistData | null;
  playlist3v3: PlaylistData | null;
  playlist4v4: PlaylistData | null;
  scrapedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tracker detail interface (tracker with seasons)
 */
export interface TrackerDetail {
  tracker: Tracker;
  seasons: TrackerSeason[];
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
  lastScrapedAt: string | null;
  scrapingStatus: TrackerScrapingStatus;
  scrapingError: string | null;
  scrapingAttempts: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  seasons?: TrackerSeason[];
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
 * Scraping status interface
 */
export interface ScrapingStatus {
  status: TrackerScrapingStatus;
  error: string | null;
  lastScrapedAt: string | null;
  attempts: number;
}



