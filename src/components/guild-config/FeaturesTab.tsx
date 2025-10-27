import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettingsStore } from '@/stores';
import type { FeaturesConfig } from '@/types';

interface FeaturesTabProps {
  guildId: string;
}

export function FeaturesTab({ guildId }: FeaturesTabProps) {
  const { settings, updateSettings, loading } = useSettingsStore();
  const features = settings?.features;

  const handleToggle = async (feature: keyof FeaturesConfig) => {
    const currentValue = features?.[feature] ?? false;
    await updateSettings(guildId, {
      features: {
        ...features,
        [feature]: !currentValue,
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
          <CardDescription>
            Enable or disable bot features for this guild
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="league_management">League Management</Label>
              <p className="text-sm text-muted-foreground">
                Create and manage leagues within your server
              </p>
            </div>
            <Switch
              id="league_management"
              checked={features?.league_management ?? false}
              onCheckedChange={() => handleToggle('league_management')}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tournament_mode">Tournament Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable tournament scheduling and management
              </p>
            </div>
            <Switch
              id="tournament_mode"
              checked={features?.tournament_mode ?? false}
              onCheckedChange={() => handleToggle('tournament_mode')}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto_roles">Auto Roles</Label>
              <p className="text-sm text-muted-foreground">
                Automatically assign roles based on user activity
              </p>
            </div>
            <Switch
              id="auto_roles"
              checked={features?.auto_roles ?? false}
              onCheckedChange={() => handleToggle('auto_roles')}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="statistics">Statistics Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Track player statistics and performance metrics
              </p>
            </div>
            <Switch
              id="statistics"
              checked={features?.statistics ?? false}
              onCheckedChange={() => handleToggle('statistics')}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="leaderboards">Leaderboards</Label>
              <p className="text-sm text-muted-foreground">
                Display leaderboards showing top players
              </p>
            </div>
            <Switch
              id="leaderboards"
              checked={features?.leaderboards ?? false}
              onCheckedChange={() => handleToggle('leaderboards')}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

