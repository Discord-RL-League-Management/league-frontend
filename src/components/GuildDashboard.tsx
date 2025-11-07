import type { Guild } from '../types/index.ts';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GuildAvatar } from '@/components/guild-avatar';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GuildConfiguration from '@/components/GuildConfiguration';
import MemberList from '@/components/MemberList';
import Overview from '@/components/Overview';
import AdminDashboard from '@/components/AdminDashboard';
import { useGuildPermissions } from '../hooks/useGuildPermissions.ts';

interface GuildDashboardProps {
  guild: Guild;
}

/**
 * Guild Dashboard Component
 * Single Responsibility: Display guild-specific information and management based on URL state
 * Separation of Concerns: Component uses hook, doesn't fetch data; routing handled by parent
 */
export default function GuildDashboard({ guild }: GuildDashboardProps) {
  const { isAdmin, loading } = useGuildPermissions(guild.id);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract active tab from URL path
  const activeTab = location.pathname.split('/').pop() || 'overview';

  const handleTabNavigate = (tab: string) => {
    navigate(`/dashboard/guild/${guild.id}/${tab}`);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        asChild
        className="flex items-center gap-2"
      >
        <Link to="/dashboard">
          Back to servers
        </Link>
      </Button>

      {/* Guild Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <GuildAvatar guild={guild} size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">{guild.name}</h1>
              <Badge variant="secondary" className="mt-2">
                {loading ? 'Loading...' : (isAdmin ? 'Administrator' : 'Member')}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tab Navigation - Overview for everyone */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => handleTabNavigate('overview')}
          className="flex-1"
        >
          Overview
        </Button>
        
        {/* Admin-only tabs */}
        {isAdmin && (
          <>
            <Button
              variant={activeTab === 'admin' ? 'default' : 'ghost'}
              onClick={() => handleTabNavigate('admin')}
              className="flex-1"
            >
              Admin Dashboard
            </Button>
            <Button
              variant={activeTab === 'members' ? 'default' : 'ghost'}
              onClick={() => handleTabNavigate('members')}
              className="flex-1"
            >
              Members
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              onClick={() => handleTabNavigate('settings')}
              className="flex-1"
            >
              Settings
            </Button>
          </>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Overview guildId={guild.id} />
      )}

      {activeTab === 'admin' && isAdmin && (
        <AdminDashboard guildId={guild.id} />
      )}

      {activeTab === 'members' && isAdmin && (
        <MemberList guildId={guild.id} />
      )}

      {activeTab === 'settings' && isAdmin && (
        <GuildConfiguration guildId={guild.id} />
      )}
    </div>
  );
}
