/**
 * Settings Type Definitions
 * All settings-related types for guild configuration
 */

/**
 * Channel configuration
 */
export interface ChannelConfig {
  id: string;
  name: string;
}

/**
 * Main guild settings type
 */
export interface GuildSettingsType {
  bot_command_channels?: ChannelConfig[];
  register_command_channels?: ChannelConfig[];
}

