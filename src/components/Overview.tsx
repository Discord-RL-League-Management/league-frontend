import { Skeleton } from '@/components/ui/skeleton.js';
import { ErrorDisplay } from '@/components/error-display.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { useAuthStore } from '@/stores/authStore.js';
import { useGuildPermissions } from '@/hooks/useGuildPermissions.js';
import { useMyTrackers } from '@/hooks/useMyTrackers.js';
import { useUserProfile } from '@/hooks/useUserProfile.js';
import { useUserStats } from '@/hooks/useUserStats.js';
import { useGuildMemberData } from '@/hooks/useGuildMemberData.js';
import {
  ProfileSection,
  StatisticsSection,
  TrackersSection,
  GuildInfoSection,
  MMRCalculatorSection,
} from './overview/index.js';

interface OverviewProps {
  guildId: string;
}

/**
 * Overview Component
 * 
 * Single responsibility: Display personalized dashboard for a user.
 * Shows user-specific data: profile, stats, teams, leagues.
 * Personalized to the current user.
 * 
 * This component now uses composition pattern with extracted section components,
 * maintaining proper separation of concerns.
 */
export default function Overview({ guildId }: OverviewProps) {
  const { user } = useAuthStore();
  const { isAdmin, loading: permissionsLoading } = useGuildPermissions(guildId);
  const { profile, loading: profileLoading, error: profileError } = useUserProfile();
  const { stats, loading: statsLoading, error: statsError } = useUserStats();
  const { userRoles, roleNameMap, loading: memberDataLoading } = useGuildMemberData(guildId, user?.id);
  const { myTrackers, isLoading: trackerLoading } = useMyTrackers();

  const loading = profileLoading || statsLoading;
  const error = profileError || statsError;

  if (loading && !profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={() => {
          // Reload page to trigger hook remount and refetch
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <ProfileSection
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        permissionsLoading={permissionsLoading}
        userRoles={userRoles}
      />

      <StatisticsSection
        stats={stats}
        loading={loading}
        error={error}
      />

      <TrackersSection
        myTrackers={myTrackers}
        isLoading={trackerLoading}
      />

      <GuildInfoSection
        userRoles={userRoles}
        roleNameMap={roleNameMap}
        loading={memberDataLoading}
      />

      <MMRCalculatorSection guildId={guildId} />

      {/* Future Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Your Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Team management coming soon</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Leagues</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">League participation coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
