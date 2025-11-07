import { useEffect } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { useGuildFromStore } from '../hooks/useGuildFromStore.ts';
import { useGuildStore } from '../stores/index.ts';
import { LoadingState } from '../components/loading-state.tsx';
import GuildDashboard from '../components/GuildDashboard.tsx';

/**
 * GuildDashboardPage - Single responsibility: Route parameter extraction and validation
 * Handles routing logic only, delegates data access to hook and rendering to component
 * Separation of Concerns: Routing validation separate from data fetching and UI
 * 
 * Fetches guild data if store is empty before making navigation decisions.
 * This prevents redirecting on page reload when store is temporarily empty.
 */
export function GuildDashboardPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const location = useLocation();
  const guild = useGuildFromStore(guildId);
  const guilds = useGuildStore((state) => state.guilds);
  const loading = useGuildStore((state) => state.loading);
  const fetchGuilds = useGuildStore((state) => state.fetchGuilds);

  useEffect(() => {
    // If guilds are not loaded and we're not loading, fetch them
    if (guilds.length === 0 && !loading) {
      fetchGuilds();
    }
  }, [guilds.length, loading, fetchGuilds]);

  // Show loading while fetching guilds
  if (loading || guilds.length === 0) {
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

