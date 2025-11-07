import { useGuildStore } from '../stores/index.ts';
import type { Guild } from '../types/index.ts';

/**
 * useGuildFromStore - Single responsibility: Get guild from Zustand store by ID
 * Reuses cached guild list data, no API call
 * Separation of Concerns: Data access only, no fetching logic
 */
export function useGuildFromStore(guildId: string | undefined): Guild | null {
  const guilds = useGuildStore((state) => state.guilds);
  
  if (!guildId) {
    return null;
  }
  
  return guilds.find((guild) => guild.id === guildId) || null;
}

