import { create } from 'zustand';
import { guildApi } from '../lib/api/guilds.ts';

/**
 * Member interface matching the API response
 */
export interface Member {
  id: string;
  userId: string;
  username: string;
  nickname?: string;
  roles: string[];
  joinedAt: string;
  user: {
    id: string;
    username: string;
    globalName?: string;
    avatar?: string;
  };
}

/**
 * Pagination info from API response
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Cache entry structure
 */
interface MemberCache {
  members: Member[];
  pagination: PaginationInfo;
  timestamp: number;
  isSearch: boolean;
}

/**
 * Cache TTL constants
 */
const LIST_TTL = 5 * 60 * 1000; // 5 minutes for list views
const SEARCH_TTL = 30 * 1000; // 30 seconds for search results
const MAX_CACHE_ENTRIES_PER_GUILD = 50; // LRU eviction limit

/**
 * Members Store State
 */
interface MembersState {
  // Cache structure: guildId -> Map<cacheKey, MemberCache>
  // Using Map for easier LRU eviction (insertion order)
  cache: Record<string, Map<string, MemberCache>>;
  loading: boolean;
  error: string | null;
  pendingRequests: Record<string, Promise<void>>;

  fetchMembers: (guildId: string, page: number, limit: number, searchQuery?: string) => Promise<void>;
  getMembers: (guildId: string, page: number, limit: number, searchQuery?: string) => {
    members: Member[];
    pagination: PaginationInfo;
    isStale: boolean;
  } | null;
  getCachedMembers: (guildId: string, page: number, limit: number, searchQuery?: string) => MemberCache | null;
  invalidateCache: (guildId: string) => void;
  isStale: (cacheEntry: MemberCache) => boolean;
  _evictOldest: (guildId: string) => void;
  _createCacheKey: (page: number, limit: number, searchQuery?: string) => string;
}

/**
 * Members Store - Centralized state management with best-practice caching
 * 
 * Features:
 * - Stale-while-revalidate: Shows cached data immediately, fetches fresh in background
 * - Differentiated TTLs: 5min for lists, 30s for search
 * - LRU eviction: Max 50 entries per guild
 * - Request deduplication: Prevents duplicate API calls
 */
export const useMembersStore = create<MembersState>((set, get) => ({
  cache: {},
  loading: false,
  error: null,
  pendingRequests: {},

  /**
   * Create cache key from page, limit, and search query
   */
  _createCacheKey: (page: number, limit: number, searchQuery?: string) => {
    return `${page}-${limit}-${searchQuery || ''}`;
  },

  /**
   * Check if cache entry is stale
   */
  isStale: (cacheEntry: MemberCache) => {
    const ttl = cacheEntry.isSearch ? SEARCH_TTL : LIST_TTL;
    return Date.now() - cacheEntry.timestamp > ttl;
  },

  /**
   * Evict oldest cache entry when limit reached
   * Note: This is now handled inline in fetchMembers for better immutability
   */
  _evictOldest: () => {
    // Reserved for potential future use
  },

  /**
   * Get cached members without fetching
   */
  getCachedMembers: (guildId: string, page: number, limit: number, searchQuery?: string) => {
    const guildCache = get().cache[guildId];
    if (!guildCache) {
      return null;
    }

    const cacheKey = get()._createCacheKey(page, limit, searchQuery);
    return guildCache.get(cacheKey) || null;
  },

  /**
   * Get members (cached or fresh) with stale-while-revalidate pattern
   */
  getMembers: (guildId: string, page: number, limit: number, searchQuery?: string) => {
    const cached = get().getCachedMembers(guildId, page, limit, searchQuery);
    if (!cached) {
      return null;
    }

    const stale = get().isStale(cached);
    return {
      members: cached.members,
      pagination: cached.pagination,
      isStale: stale,
    };
  },

  /**
   * Fetch members with stale-while-revalidate pattern
   * Returns cached data immediately if available, fetches fresh in background
   */
  fetchMembers: async (guildId: string, page: number, limit: number, searchQuery?: string) => {
    // Input validation
    if (!guildId || typeof guildId !== 'string' || guildId.trim() === '') {
      console.warn('fetchMembers called with invalid guildId:', guildId);
      return;
    }
    if (typeof page !== 'number' || page < 1) {
      console.warn('fetchMembers called with invalid page:', page);
      return;
    }
    if (typeof limit !== 'number' || limit < 1) {
      console.warn('fetchMembers called with invalid limit:', limit);
      return;
    }

    const cacheKey = get()._createCacheKey(page, limit, searchQuery);
    const requestKey = `${guildId}-${cacheKey}`;
    const isSearch = !!searchQuery;

    // Check for cached data (even if stale - SWR pattern)
    const cached = get().getCachedMembers(guildId, page, limit, searchQuery);
    const hasCachedData = !!cached;

    const existingRequest = get().pendingRequests[requestKey];
    if (existingRequest) {
      return existingRequest;
    }

    if (hasCachedData && !get().isStale(cached!)) {
      return;
    }

    let isAborted = false;

    const requestPromise = (async () => {
      try {
        if (isAborted) {
          return;
        }

        // Only set loading if we don't have cached data (SWR pattern)
        if (!hasCachedData) {
          set({ error: null, loading: true });
        }

        const data = isSearch
          ? await guildApi.searchGuildMembers(guildId, searchQuery!, page, limit)
          : await guildApi.getGuildMembers(guildId, page, limit);

        if (isAborted) {
          return;
        }

        const currentCache = get().cache;
        
        let guildCache = currentCache[guildId];
        if (!guildCache) {
          guildCache = new Map();
        } else {
          // Create a new Map instance to ensure immutability
          guildCache = new Map(guildCache);
        }

        // Evict oldest if at limit (before adding new entry)
        if (guildCache.size >= MAX_CACHE_ENTRIES_PER_GUILD) {
          // Map preserves insertion order, so first entry is oldest
          const firstKey = guildCache.keys().next().value;
          if (firstKey) {
            guildCache.delete(firstKey);
          }
        }

        const cacheEntry: MemberCache = {
          members: data.members as Member[],
          pagination: data.pagination as PaginationInfo,
          timestamp: Date.now(),
          isSearch,
        };

        guildCache.set(cacheKey, cacheEntry);

        set((state) => ({
          cache: {
            ...state.cache,
            [guildId]: guildCache,
          },
          loading: false,
        }));
      } catch (err: unknown) {
        if (isAborted) {
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
        set({ error: errorMessage, loading: false });
        console.error('Error fetching members:', err);
      } finally {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [requestKey]: _, ...rest } = state.pendingRequests;
          return { pendingRequests: rest };
        });
      }
    })();

    (requestPromise as Promise<void> & { abort?: () => void }).abort = () => {
      isAborted = true;
    };

    set((state) => ({
      pendingRequests: { ...state.pendingRequests, [requestKey]: requestPromise },
    }));

    return requestPromise;
  },

  /**
   * Invalidate all cache entries for a guild
   */
  invalidateCache: (guildId: string) => {
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [guildId]: _, ...rest } = state.cache;
      return { cache: rest };
    });
  },
}));

