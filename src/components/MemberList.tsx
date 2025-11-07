import { useState, useEffect, useCallback, memo } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useMembersStore } from '@/stores/membersStore.ts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Button } from '@/components/ui/button.tsx';
import { LoadingState } from '@/components/loading-state.tsx';
import { ErrorDisplay } from '@/components/error-display.tsx';
import { UserAvatar } from '@/components/user-avatar.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';
import type { Member } from '@/stores/membersStore.ts';

interface MemberListProps {
  guildId: string;
}

interface MemberListItemProps {
  member: Member;
}

/**
 * MemberListItem Component - Memoized member item
 * Prevents unnecessary re-renders when parent re-renders
 */
const MemberListItemComponent = ({ member }: MemberListItemProps) => {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-muted rounded">
      <UserAvatar user={member.user} size="sm" />
      <div className="flex-1">
        <div className="font-medium">
          {member.nickname || member.user.globalName || member.user.username}
        </div>
        <div className="text-sm text-muted-foreground">
          @{member.user.username}
          {member.nickname && member.nickname !== member.user.username && (
            <span className="ml-2 text-xs">({member.nickname})</span>
          )}
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {member.roles.length} roles
      </div>
    </div>
  );
};

const MemberListItem = memo(MemberListItemComponent);
MemberListItem.displayName = 'MemberListItem';

/**
 * MemberList Component
 * Single Responsibility: Display guild members with pagination and search
 * Uses membersStore with stale-while-revalidate pattern for instant UI
 */
export default function MemberList({ guildId }: MemberListProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Get store methods and state
  const fetchMembers = useMembersStore((state) => state.fetchMembers);
  const getMembers = useMembersStore((state) => state.getMembers);
  const loading = useMembersStore((state) => state.loading);
  const error = useMembersStore((state) => state.error);
  
  // Subscribe to cache updates for this specific query
  // This selector will cause re-renders when the cache updates
  const cacheKey = `${page}-20-${debouncedSearchQuery || ''}`;
  const cacheEntry = useMembersStore((state) => {
    const guildCache = state.cache[guildId];
    if (!guildCache) return null;
    return guildCache.get(cacheKey) || null;
  });

  // Derive members and pagination from cache entry
  const members = cacheEntry?.members || [];
  const totalPages = cacheEntry?.pagination.pages || 1;

  const loadMembers = useCallback(async () => {
    // Check for cached data first (SWR pattern)
    const cached = getMembers(guildId, page, 20, debouncedSearchQuery);
    
    if (cached) {
      // If stale, fetch fresh data in background (SWR pattern)
      if (cached.isStale) {
        // Fetch in background without showing loading state
        await fetchMembers(guildId, page, 20, debouncedSearchQuery);
      }
    } else {
      // No cache, fetch and show loading
      await fetchMembers(guildId, page, 20, debouncedSearchQuery);
    }
  }, [guildId, page, debouncedSearchQuery, fetchMembers, getMembers]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Reset page when search query changes (debounced)
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    // Search is debounced, so just reset page
    // The debounced value change will trigger the effect
  };

  if (loading && members.length === 0) {
    return <LoadingState message="Loading members..." />;
  }

  if (error && members.length === 0) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
              <MemberListItem key={member.id} member={member} />
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
