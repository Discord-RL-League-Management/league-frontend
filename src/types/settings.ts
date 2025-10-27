/**
 * Settings Type Definitions
 * All settings-related types for guild configuration
 */

/**
 * Base role configuration
 */
export interface RoleConfig {
  id: string;
  name: string;
}

/**
 * Base channel configuration
 */
export interface ChannelConfig {
  id: string;
  name: string;
}

/**
 * Roles configuration - supports multiple roles per type
 */
export interface RolesConfig {
  admin?: RoleConfig[];
  moderator?: RoleConfig[];
  member?: RoleConfig[];
  league_manager?: RoleConfig[];
  tournament_manager?: RoleConfig[];
}

/**
 * Channels configuration - single channel per type
 */
export interface ChannelsConfig {
  general?: ChannelConfig;
  announcements?: ChannelConfig;
  league_chat?: ChannelConfig;
  tournament_chat?: ChannelConfig;
  logs?: ChannelConfig;
}

/**
 * Features configuration - boolean flags for feature toggles
 */
export interface FeaturesConfig {
  league_management?: boolean;
  tournament_mode?: boolean;
  auto_roles?: boolean;
  statistics?: boolean;
  leaderboards?: boolean;
}

/**
 * Permissions configuration - role-based permissions
 */
export interface PermissionsConfig {
  create_leagues?: string[];
  manage_teams?: string[];
  view_stats?: string[];
  manage_tournaments?: string[];
  manage_roles?: string[];
  view_logs?: string[];
}

/**
 * Display configuration - UI and display options
 */
export interface DisplayConfig {
  show_leaderboards?: boolean;
  show_member_count?: boolean;
  theme?: 'default' | 'dark' | 'light';
  command_prefix?: string;
}

/**
 * Main guild settings type - container for all configuration types
 */
export interface GuildSettingsType {
  channels?: ChannelsConfig;
  roles?: RolesConfig;
  features?: FeaturesConfig;
  permissions?: PermissionsConfig;
  display?: DisplayConfig;
}

