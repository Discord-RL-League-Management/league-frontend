/**
 * User Type Definitions
 * Core user types used across authentication and profile features
 */

export interface User {
  id: string;
  username: string;
  discriminator?: string;
  globalName?: string;
  avatar?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
  email?: string;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface UserSettings {
  notifications: boolean;
  theme: string;
}

