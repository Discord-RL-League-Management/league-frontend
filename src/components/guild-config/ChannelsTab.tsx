import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { useSettingsStore } from '@/stores';
import type { ChannelsConfig } from '@/types';

interface ChannelsTabProps {
  guildId: string;
}

export function ChannelsTab({ guildId }: ChannelsTabProps) {
  const { settings } = useSettingsStore();
  const channels = settings?.channels;

  const channelList = [
    { key: 'general', label: 'General', description: 'Main general chat channel' },
    { key: 'announcements', label: 'Announcements', description: 'Server announcements channel' },
    { key: 'league_chat', label: 'League Chat', description: 'League discussion channel' },
    { key: 'tournament_chat', label: 'Tournament Chat', description: 'Tournament discussion channel' },
    { key: 'logs', label: 'Logs', description: 'Bot logs and events channel' },
  ] as const;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Channel Configuration</CardTitle>
          <CardDescription>
            Configure Discord channels for bot features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channelList.map(({ key, label, description }) => {
            const channel = channels?.[key as keyof ChannelsConfig];
            
            return (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{label}</div>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {channel ? (
                    <>
                      <Badge variant="secondary">{channel.name}</Badge>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{channel.id}</code>
                    </>
                  ) : (
                    <Badge variant="outline">Not Configured</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground text-center">
        Channel configuration requires Discord API integration.
        <br />
        Guild ID: {guildId}
      </div>
    </div>
  );
}

