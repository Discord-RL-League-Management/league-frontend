import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui/skeleton.js';
import { Badge } from '@/components/ui/badge.js';
import { ErrorDisplay } from '@/components/error-display.js';
import { UserAvatar } from '@/components/user-avatar.js';
import { profileApi } from '@/lib/api/profile.js';
import { guildApi } from '@/lib/api/guilds.js';
import { useAuthStore } from '@/stores/authStore.js';
import { useGuildPermissions } from '@/hooks/useGuildPermissions.js';
import { useTrackersStore } from '@/stores/trackersStore.js';
import { TrackerRegistrationForm } from '@/components/tracker-registration/TrackerRegistrationForm.js';
import { MmrCalculator } from '@/components/mmr-calculator/MmrCalculator.js';
import { Gamepad2, Trophy, Users, TrendingUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UserProfile, UserStats } from '@/types/index.js';
import type { DiscordRole } from '@/types/discord.js';
import type { Member } from '@/stores/membersStore.js';

interface OverviewProps {
  guildId: string;
}

/**
 * Overview - Single responsibility: Display personalized dashboard for a user
 * Shows user-specific data: profile, stats, teams, leagues
 * Personalized to the current user
 */
export default function Overview({ guildId }: OverviewProps) {
  const { user } = useAuthStore();
  const { isAdmin, loading: permissionsLoading } = useGuildPermissions(guildId);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guildRoles, setGuildRoles] = useState<DiscordRole[]>([]);
  const [userMembership, setUserMembership] = useState<Member | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const { myTrackers, getMyTrackers, loading: trackerLoading } = useTrackersStore();

  // Fetch current user's trackers
  useEffect(() => {
    if (user?.id) {
      getMyTrackers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id, not the function

  // Fetch current user's membership directly
  useEffect(() => {
    if (!user?.id || !guildId) {
      setUserMembership(null);
      return;
    }

    const fetchUserMembership = async () => {
      setMembershipLoading(true);
      try {
        const membership = await guildApi.getGuildMember(guildId, user.id);
        setUserMembership(membership);
      } catch (err) {
        console.error('Error fetching user membership:', err);
        setUserMembership(null);
      } finally {
        setMembershipLoading(false);
      }
    };

    fetchUserMembership();
  }, [guildId, user?.id]);

  // Ensure roles is always an array (handle null/undefined)
  const userRoles = Array.isArray(userMembership?.roles) ? userMembership.roles : [];

  // Create a map of roleId -> roleName for quick lookup
  const roleNameMap = useMemo(() => {
    const map = new Map<string, string>();
    guildRoles.forEach(role => {
      map.set(role.id, role.name);
    });
    return map;
  }, [guildRoles]);

  // Fetch guild roles (try for all users, handle 403 gracefully for non-admins)
  useEffect(() => {
    const fetchRoles = async () => {
      if (permissionsLoading) return;
      
      try {
        const roles = await guildApi.getGuildRoles(guildId);
        setGuildRoles(roles);
      } catch (err: any) {
        // Handle 403 (non-admins can't fetch roles) gracefully
        if (err.response?.status === 403 || err.status === 403) {
          // Non-admins can't fetch roles - this is expected, don't show error
          setGuildRoles([]);
        } else {
          // Other errors - log but don't block UI
          console.warn('Failed to fetch guild roles:', err);
        }
      }
    };

    fetchRoles();
  }, [guildId, permissionsLoading]);

  // Fetch user profile and stats
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const [profileData, statsData] = await Promise.all([
          profileApi.getProfile(),
          profileApi.getStats(),
        ]);

        setProfile(profileData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Metric Card Component
  const MetricCard = ({ 
    title, 
    value, 
    description,
    icon: Icon, 
    isLoading, 
    error,
    iconColor = "text-muted-foreground",
    iconBg = "bg-muted"
  }: {
    title: string;
    value: string | number | null;
    description?: string;
    icon: React.ElementType;
    isLoading: boolean;
    error?: string | null;
    iconColor?: string;
    iconBg?: string;
  }) => {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`${iconBg} p-2 rounded-lg`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-24 mb-2" />
          ) : error ? (
            <p className="text-sm text-destructive">Error loading</p>
          ) : (
            <>
              <div className="text-4xl font-bold mb-1">{value?.toLocaleString() ?? '—'}</div>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

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
          setError(null);
          if (user) {
            profileApi.getProfile().then(setProfile).catch(err => 
              setError(err instanceof Error ? err.message : 'Failed to load profile')
            );
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {user && <UserAvatar user={user} size="lg" />}
            <div>
              <h2 className="text-2xl font-semibold">
                {profile?.globalName || profile?.username || user?.username || 'User'}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {permissionsLoading ? (
                  <Badge variant="secondary">Loading...</Badge>
                ) : (
                  <Badge variant={isAdmin ? 'default' : 'secondary'}>
                    {isAdmin ? 'Administrator' : 'Member'}
                  </Badge>
                )}
                {userRoles.length > 0 && (
                  <Badge variant="outline">
                    {userRoles.length} role{userRoles.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Personal Statistics Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Games Played"
            value={stats?.gamesPlayed ?? 0}
            description="Total games played"
            icon={Gamepad2}
            isLoading={loading}
            error={error}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
          />

          <MetricCard
            title="Wins"
            value={stats?.wins ?? 0}
            description="Total victories"
            icon={Trophy}
            isLoading={loading}
            error={error}
            iconColor="text-yellow-600 dark:text-yellow-400"
            iconBg="bg-yellow-100 dark:bg-yellow-900/30"
          />

          <MetricCard
            title="Win Rate"
            value={stats?.winRate ? `${(stats.winRate * 100).toFixed(1)}%` : '0%'}
            description={stats?.gamesPlayed ? `${stats.gamesPlayed} games` : 'No games played'}
            icon={TrendingUp}
            isLoading={loading}
            error={error}
            iconColor="text-green-600 dark:text-green-400"
            iconBg="bg-green-100 dark:bg-green-900/30"
          />

          <MetricCard
            title="Guilds"
            value={stats?.guildsCount ?? 0}
            description={`${stats?.activeGuildsCount ?? 0} active`}
            icon={Users}
            isLoading={loading}
            error={error}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-100 dark:bg-purple-900/30"
          />
        </div>
      </div>

      {/* Tracker Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Trackers ({myTrackers.length}/4)</CardTitle>
        </CardHeader>
        <CardContent>
          {trackerLoading ? (
            <Skeleton className="h-32" />
          ) : myTrackers.length > 0 ? (
            <div className="space-y-4">
              {myTrackers.map((tracker) => (
                <div key={tracker.id} className="space-y-4 border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{tracker.username}</h3>
                      <p className="text-sm text-muted-foreground">{tracker.platform}</p>
                    </div>
                    <Badge
                      variant={
                        tracker.scrapingStatus === 'COMPLETED'
                          ? 'default'
                          : tracker.scrapingStatus === 'IN_PROGRESS'
                          ? 'secondary'
                          : tracker.scrapingStatus === 'FAILED'
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {tracker.scrapingStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {tracker.lastScrapedAt && (
                      <span>
                        Last updated: {new Date(tracker.lastScrapedAt).toLocaleDateString()}
                      </span>
                    )}
                    {tracker.seasons && tracker.seasons.length > 0 && (
                      <span>{tracker.seasons.length} seasons tracked</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/dashboard/tracker/${tracker.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      View Details
                    </Link>
                    <a
                      href={tracker.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Tracker.gg
                    </a>
                  </div>
                </div>
              ))}
              {myTrackers.length < 4 && (
                <div className="pt-4">
                  <Link
                    to="/dashboard/trackers"
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-sm inline-block"
                  >
                    Add Another Tracker
                  </Link>
                </div>
              )}
              <div className="pt-2">
                <Link
                  to="/dashboard/trackers"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Manage All Trackers →
                </Link>
              </div>
            </div>
          ) : (
            <TrackerRegistrationForm />
          )}
        </CardContent>
      </Card>

      {/* Guild-Specific Information */}
      <Card>
        <CardHeader>
          <CardTitle>Guild Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Your Roles:</span>
              <div className="flex gap-1 flex-wrap justify-end">
                {membershipLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : userRoles.length > 0 ? (
                  userRoles.map((roleId: string) => {
                    const roleName = roleNameMap.get(roleId);
                    return (
                      <Badge key={roleId} variant="outline" className="text-xs">
                        {roleName || `Role ${roleId.slice(0, 8)}...`}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MMR Calculator - Available to everyone */}
      <MmrCalculator guildId={guildId} />

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

