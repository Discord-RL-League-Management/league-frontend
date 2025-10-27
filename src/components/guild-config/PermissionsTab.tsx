import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldIcon } from 'lucide-react';
import { useSettingsStore } from '@/stores';
import type { PermissionsConfig } from '@/types';

interface PermissionsTabProps {
  guildId: string;
}

export function PermissionsTab(_props: PermissionsTabProps) {
  const { settings } = useSettingsStore();
  const permissions = settings?.permissions;

  const permissionList = [
    { key: 'create_leagues', label: 'Create Leagues', description: 'Allow creating new leagues' },
    { key: 'manage_teams', label: 'Manage Teams', description: 'Allow managing teams in leagues' },
    { key: 'view_stats', label: 'View Statistics', description: 'Allow viewing player statistics' },
    { key: 'manage_tournaments', label: 'Manage Tournaments', description: 'Allow managing tournaments' },
    { key: 'manage_roles', label: 'Manage Roles', description: 'Allow managing bot roles' },
    { key: 'view_logs', label: 'View Logs', description: 'Allow viewing bot logs' },
  ] as const;

  const renderRoles = (roleArray: string[] | undefined) => {
    if (!roleArray || roleArray.length === 0) {
      return <Badge variant="outline">None</Badge>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {roleArray.map((role) => (
          <Badge key={role} variant="secondary">
            {role}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Permission Configuration</CardTitle>
          <CardDescription>
            Configure role-based permissions for bot features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permissionList.map(({ key, label, description }) => {
            const allowedRoles = permissions?.[key as keyof PermissionsConfig];
            
            return (
              <div key={key} className="p-3 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldIcon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{label}</div>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <div className="mt-2">
                  {renderRoles(allowedRoles as string[] | undefined)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

