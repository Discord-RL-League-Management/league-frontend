import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UsersIcon } from 'lucide-react';
import { useSettingsStore } from '@/stores';
import type { RolesConfig, RoleConfig } from '@/types';

interface RolesTabProps {
  guildId: string;
}

export function RolesTab({ guildId: _guildId }: RolesTabProps) {
  const { settings } = useSettingsStore();
  const roles = settings?.roles;

  const roleTypes = [
    { key: 'admin', label: 'Admin', description: 'Administrator roles with full permissions' },
    { key: 'moderator', label: 'Moderator', description: 'Moderator roles for managing leagues' },
    { key: 'member', label: 'Member', description: 'Regular member roles' },
    { key: 'league_manager', label: 'League Manager', description: 'Roles that can manage leagues' },
    { key: 'tournament_manager', label: 'Tournament Manager', description: 'Roles that can manage tournaments' },
  ] as const;

  const renderRoleList = (roleList: RoleConfig[] | undefined) => {
    if (!roleList || roleList.length === 0) {
      return <Badge variant="outline">None Configured</Badge>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {roleList.map((role) => (
          <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
            {role.name}
            <code className="text-xs ml-1 opacity-70">{role.id.slice(0, 8)}...</code>
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Role Configuration</CardTitle>
          <CardDescription>
            Configure Discord roles for bot permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {roleTypes.map(({ key, label, description }) => {
            const roleList = roles?.[key as keyof RolesConfig];
            
            return (
              <div key={key} className="p-3 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <UsersIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{label}</div>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <div className="mt-2">
                  {renderRoleList(roleList)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground text-center">
        Role configuration requires Discord API integration
      </div>
    </div>
  );
}

