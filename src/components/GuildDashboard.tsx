import { type Guild } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GuildAvatar } from '@/components/guild-avatar';
import { ArrowLeft } from 'lucide-react';
import GuildConfiguration from '@/components/GuildConfiguration';
import { useState } from 'react';

interface GuildDashboardProps {
  guild: Guild;
  onBack: () => void;
}

/**
 * Guild Dashboard Component
 * Single Responsibility: Display guild-specific information and management
 * Separation of Concerns: UI presentation only, delegates actions to parent
 */
export default function GuildDashboard({ guild, onBack }: GuildDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to servers
      </Button>

      {/* Guild Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <GuildAvatar guild={guild} size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">{guild.name}</h1>
              <Badge variant="secondary" className="mt-2">
                {guild.roles.includes('admin') ? 'Administrator' : 'Member'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tab Navigation */}
      {guild.roles.includes('admin') && (
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className="flex-1"
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('settings')}
            className="flex-1"
          >
            Settings
          </Button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Guild configuration and bot settings will be available here.
            </p>
          </CardContent>
        </Card>

        {/* Members Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-foreground">Members</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Member management and role assignments will be available here.
            </p>
          </CardContent>
        </Card>

        {/* Leagues Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-foreground">Leagues</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              League creation and management will be available here.
            </p>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-foreground">Statistics</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Guild statistics and activity metrics will be available here.
            </p>
          </CardContent>
        </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <GuildConfiguration guildId={guild.id} />
      )}
    </div>
  );
}
