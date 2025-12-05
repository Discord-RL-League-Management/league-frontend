import { useParams, Navigate, useLocation } from 'react-router-dom';
import { useGuildFromStore } from '../hooks/useGuildFromStore.ts';
import { useGuilds } from '../hooks/useGuilds.ts';
import { LoadingState } from '../components/loading-state.tsx';
import GuildDashboard from '../components/GuildDashboard.tsx';

/**
 * GuildDashboardPage - Single responsibility: Route parameter extraction and validation
 * Handles routing logic only, delegates data access to hook and rendering to component
 * Separation of Concerns: Routing validation separate from data fetching and UI
 * 
 * Uses useGuilds hook - hook handles all fetching logic automatically.
 * Component focuses on routing logic only.
 */
export function GuildDashboardPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const location = useLocation();
  const { guilds, isLoading } = useGuilds();
  const guild = useGuildFromStore(guildId);

  // Show loading while fetching guilds
  if (isLoading || guilds.length === 0) {
    return <LoadingState message="Loading guild..." />;
  }

  // Only redirect if guilds are loaded but this specific guild is not found
  if (!guild) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect base guild route to overview
  const currentPath = location.pathname;
  if (currentPath === `/dashboard/guild/${guildId}`) {
    return <Navigate to={`/dashboard/guild/${guildId}/overview`} replace />;
  }

  return <GuildDashboard guild={guild} />;
}

/**
 * GuildDashboardRedirect - Single responsibility: Redirect guild base route to overview
 * Separation of Concerns: Handles redirect logic only
 */
export function GuildDashboardRedirect() {
  const { guildId } = useParams<{ guildId: string }>();
  return <Navigate to={`/dashboard/guild/${guildId}/overview`} replace />;
}

