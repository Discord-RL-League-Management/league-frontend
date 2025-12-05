/**
 * Guild Type Definitions
 * Core guild types and details
 */

export interface Guild {
  id: string;
  name: string;
  icon?: string;
  roles: string[];
}

// Import settings types from settings.ts
import type { GuildSettingsType } from './settings.js';

import type { Member } from '../stores/membersStore.js';

export interface GuildDetails extends Guild {
  settings?: GuildSettingsType;
  members?: Member[];
}

