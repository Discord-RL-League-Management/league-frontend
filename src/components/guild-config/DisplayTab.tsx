import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/stores';
import type { DisplayConfig } from '@/types';

interface DisplayTabProps {
  guildId: string;
}

export function DisplayTab({ guildId }: DisplayTabProps) {
  const { settings, updateSettings, loading } = useSettingsStore();
  const display = settings?.display;

  const handleToggle = async (feature: keyof DisplayConfig) => {
    const currentValue = display?.[feature];
    if (typeof currentValue === 'boolean') {
      await updateSettings(guildId, {
        display: {
          ...display,
          [feature]: !currentValue,
        },
      });
    }
  };

  const handleThemeChange = async (theme: string) => {
    await updateSettings(guildId, {
      display: {
        ...display,
        theme: theme as 'default' | 'dark' | 'light',
      },
    });
  };

  const handlePrefixChange = async (prefix: string) => {
    await updateSettings(guildId, {
      display: {
        ...display,
        command_prefix: prefix,
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>
            Configure how the bot displays information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_leaderboards">Show Leaderboards</Label>
              <p className="text-sm text-muted-foreground">
                Display leaderboards in public channels
              </p>
            </div>
            <Switch
              id="show_leaderboards"
              checked={display?.show_leaderboards ?? false}
              onCheckedChange={() => handleToggle('show_leaderboards')}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_member_count">Show Member Count</Label>
              <p className="text-sm text-muted-foreground">
                Display member count in bot messages
              </p>
            </div>
            <Switch
              id="show_member_count"
              checked={display?.show_member_count ?? false}
              onCheckedChange={() => handleToggle('show_member_count')}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={display?.theme ?? 'default'}
              onValueChange={handleThemeChange}
              disabled={loading}
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Theme for bot messages and embeds
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="command_prefix">Command Prefix</Label>
            <Input
              id="command_prefix"
              value={display?.command_prefix ?? '!'}
              onChange={(e) => handlePrefixChange(e.target.value)}
              disabled={loading}
              maxLength={5}
              placeholder="!"
            />
            <p className="text-sm text-muted-foreground">
              Prefix for bot commands (1-5 characters)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

