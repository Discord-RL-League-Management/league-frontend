import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui/skeleton.js';
import { Badge } from '@/components/ui/badge.js';

interface GuildInfoSectionProps {
  userRoles: string[];
  roleNameMap: Map<string, string>;
  loading: boolean;
}

/**
 * GuildInfoSection Component
 * 
 * Displays guild-specific information including user roles.
 */
export function GuildInfoSection({
  userRoles,
  roleNameMap,
  loading,
}: GuildInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Guild Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Your Roles:</span>
            <div className="flex gap-1 flex-wrap justify-end">
              {loading ? (
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
  );
}

