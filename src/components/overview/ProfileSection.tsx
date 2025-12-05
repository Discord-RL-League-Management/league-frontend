import { Card, CardHeader } from '@/components/ui/card.js';
import { Badge } from '@/components/ui/badge.js';
import { UserAvatar } from '@/components/user-avatar.js';
import type { UserProfile, User } from '@/types/index.js';

interface ProfileSectionProps {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  permissionsLoading: boolean;
  userRoles: string[];
}

/**
 * ProfileSection Component
 * 
 * Displays user profile information including avatar, name, and role badges.
 */
export function ProfileSection({
  user,
  profile,
  isAdmin,
  permissionsLoading,
  userRoles,
}: ProfileSectionProps) {
  return (
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
  );
}

