import { useState, useEffect } from 'react';
import { guildApi } from '@/lib/api/guilds';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';

interface Member {
  id: string;
  userId: string;
  username: string;
  roles: string[];
  joinedAt: string;
  user: {
    id: string;
    username: string;
    globalName?: string;
    avatar?: string;
  };
}

interface MemberListProps {
  guildId: string;
}

/**
 * MemberList Component
 * Single Responsibility: Display guild members with pagination and search
 */
export default function MemberList({ guildId }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMembers();
  }, [guildId, page]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = searchQuery 
        ? await guildApi.searchGuildMembers(guildId, searchQuery, page, 20)
        : await guildApi.getGuildMembers(guildId, page, 20);

      setMembers(data.members);
      setTotalPages(data.pagination.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await loadMembers();
  };

  if (loading && members.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && members.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="max-w-sm"
        />
        <Button type="submit">Search</Button>
      </form>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {member.user.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`}
                      alt={member.user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <span className="text-xs font-bold">
                      {member.user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{member.user.globalName || member.user.username}</div>
                  <div className="text-sm text-muted-foreground">@{member.user.username}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {member.roles.length} roles
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
