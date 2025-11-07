/**
 * Discord API Type Definitions
 * Types for Discord API responses
 */

/**
 * Discord channel from Discord API
 * Discord channel types: 4 = GUILD_CATEGORY, 0 = GUILD_TEXT, 2 = GUILD_VOICE, 5 = GUILD_ANNOUNCEMENT
 */
export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  parent_id?: string;
}

/**
 * Discord role from Discord API
 */
export interface DiscordRole {
  id: string;
  name: string;
}






