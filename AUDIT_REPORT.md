# Frontend Code Audit Report

**Date:** 2025-01-02  
**Scope:** league-frontend/src  
**Focus:** Critical bugs, security vulnerabilities, performance issues, memory leaks

---

## 🔴 CRITICAL ISSUES

### 1. Memory Leak: Missing Cleanup in Overview.tsx useEffect Hooks

**File:** `src/components/Overview.tsx`  
**Lines:** 42-62, 77-97, 100-123

**Issue:** Multiple `useEffect` hooks perform async operations without cleanup functions. If the component unmounts while requests are in flight, state updates will occur on unmounted components, causing memory leaks and React warnings.

**Impact:** Memory leaks, potential crashes, React warnings in console

**Fix Required:**
```typescript
useEffect(() => {
  let cancelled = false;
  
  const fetchUserMembership = async () => {
    setMembershipLoading(true);
    try {
      const membership = await guildApi.getGuildMember(guildId, user.id);
      if (!cancelled) {
        setUserMembership(membership);
      }
    } catch (err) {
      if (!cancelled) {
        console.error('Error fetching user membership:', err);
        setUserMembership(null);
      }
    } finally {
      if (!cancelled) {
        setMembershipLoading(false);
      }
    }
  };

  fetchUserMembership();
  
  return () => {
    cancelled = true;
  };
}, [guildId, user?.id]);
```

**Apply same pattern to:**
- Lines 77-97 (fetchRoles)
- Lines 100-123 (loadData)

---

### 2. Race Condition: Multiple Simultaneous API Calls in Overview.tsx

**File:** `src/components/Overview.tsx`  
**Lines:** 42-123

**Issue:** Three independent `useEffect` hooks can trigger simultaneously when component mounts, causing multiple API calls. No request cancellation mechanism.

**Impact:** Unnecessary API calls, potential race conditions, inconsistent UI state

**Fix Required:** Use AbortController for request cancellation:
```typescript
useEffect(() => {
  const abortController = new AbortController();
  
  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [profileData, statsData] = await Promise.all([
        profileApi.getProfile({ signal: abortController.signal }),
        profileApi.getStats({ signal: abortController.signal }),
      ]);
      
      if (!abortController.signal.aborted) {
        setProfile(profileData);
        setStats(statsData);
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  };
  
  loadData();
  
  return () => {
    abortController.abort();
  };
}, [user]);
```

---

### 3. Security: Potential XSS in AuthCallback.tsx

**File:** `src/pages/AuthCallback.tsx`  
**Line:** 21

**Issue:** User-controlled `error` parameter is encoded but still inserted into URL. While `encodeURIComponent` helps, direct URL construction is risky.

**Impact:** Potential XSS if error message contains malicious content, URL manipulation

**Fix Required:**
```typescript
if (error) {
  const description = searchParams.get('description') || 'Authentication failed';
  console.error('OAuth error:', error, description);
  // Use state instead of URL params for error messages
  navigate('/login', { 
    replace: true,
    state: { error: error, description: description }
  });
  return;
}
```

Then handle in Login component via `useLocation().state`.

---

### 4. Bug: Incorrect Toast Timeout Value

**File:** `src/components/ui/use-toast.ts`  
**Line:** 6

**Issue:** `TOAST_REMOVE_DELAY` is set to `1000000` milliseconds (1000 seconds = ~16 minutes), which is clearly incorrect.

**Impact:** Toasts never auto-dismiss, memory accumulation

**Fix Required:**
```typescript
const TOAST_REMOVE_DELAY = 5000 // 5 seconds
```

---

### 5. Memory Leak: Toast Timeouts Not Cleared on Dismiss

**File:** `src/components/ui/use-toast.ts`  
**Lines:** 55-69, 87-109

**Issue:** When a toast is manually dismissed, its timeout is not cleared from `toastTimeouts` Map, causing memory leaks.

**Impact:** Memory leaks, unnecessary timeout executions

**Fix Required:**
```typescript
case "DISMISS_TOAST": {
  const { toastId } = action

  if (toastId) {
    // Clear existing timeout before adding to remove queue
    const existingTimeout = toastTimeouts.get(toastId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      toastTimeouts.delete(toastId);
    }
    addToRemoveQueue(toastId)
  } else {
    // Clear all timeouts
    toastTimeouts.forEach(timeout => clearTimeout(timeout));
    toastTimeouts.clear();
    state.toasts.forEach((toast) => {
      addToRemoveQueue(toast.id)
    })
  }
  // ... rest of code
}
```

---

## 🟡 HIGH PRIORITY ISSUES

### 6. Missing Error Handling: ProtectedRoute.tsx

**File:** `src/components/ProtectedRoute.tsx`  
**Line:** 17

**Issue:** `fetchUser()` call is not awaited or caught. If it fails, error state is set in store but component doesn't handle it gracefully.

**Impact:** Unhandled promise rejection warnings, poor UX on auth failures

**Fix Required:**
```typescript
useEffect(() => {
  if (!user && !loading) {
    fetchUser().catch((err) => {
      // Error is handled in store, but prevent unhandled rejection
      console.error('Failed to fetch user:', err);
    });
  }
}, [user, loading, fetchUser]);
```

---

### 7. Performance: Missing Memoization in MemberList.tsx

**File:** `src/components/MemberList.tsx`  
**Lines:** 68-73

**Issue:** Cache selector function is recreated on every render, causing unnecessary re-renders.

**Impact:** Performance degradation, unnecessary computations

**Fix Required:**
```typescript
const cacheKey = `${page}-20-${debouncedSearchQuery || ''}`;
const cacheEntry = useMembersStore(
  useCallback(
    (state) => {
      const guildCache = state.cache[guildId];
      if (!guildCache) return null;
      return guildCache.get(cacheKey) || null;
    },
    [guildId, cacheKey]
  )
);
```

---

### 8. Race Condition: MemberList.tsx loadMembers

**File:** `src/components/MemberList.tsx`  
**Lines:** 79-97

**Issue:** `loadMembers` callback can be called multiple times rapidly (e.g., during rapid page changes), causing race conditions. No cancellation mechanism.

**Impact:** Inconsistent UI state, potential race conditions

**Fix Required:** Add AbortController or use a ref to track in-flight requests:
```typescript
const loadMembersRef = useRef<AbortController | null>(null);

const loadMembers = useCallback(async () => {
  // Cancel previous request
  if (loadMembersRef.current) {
    loadMembersRef.current.abort();
  }
  
  const abortController = new AbortController();
  loadMembersRef.current = abortController;
  
  try {
    const cached = getMembers(guildId, page, 20, debouncedSearchQuery);
    
    if (cached) {
      if (cached.isStale) {
        await fetchMembers(guildId, page, 20, debouncedSearchQuery);
      }
    } else {
      await fetchMembers(guildId, page, 20, debouncedSearchQuery);
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Error loading members:', err);
    }
  } finally {
    if (loadMembersRef.current === abortController) {
      loadMembersRef.current = null;
    }
  }
}, [guildId, page, debouncedSearchQuery, fetchMembers, getMembers]);
```

---

## 🟢 MEDIUM PRIORITY ISSUES

### 9. Type Safety: Unsafe localStorage Access

**File:** `src/components/theme-provider.tsx`  
**Line:** 34

**Issue:** `localStorage.getItem()` returns `string | null`, but cast to `Theme` without validation.

**Impact:** Potential runtime errors if localStorage contains invalid theme value

**Fix Required:**
```typescript
const storedTheme = localStorage.getItem(storageKey);
const validThemes: Theme[] = ['dark', 'light', 'system'];
return (storedTheme && validThemes.includes(storedTheme as Theme)) 
  ? (storedTheme as Theme) 
  : defaultTheme;
```

---

### 10. Performance: Unnecessary Re-renders in Overview.tsx

**File:** `src/components/Overview.tsx`  
**Lines:** 68-74

**Issue:** `roleNameMap` useMemo depends on `guildRoles` array, but array reference changes even if contents are the same.

**Impact:** Unnecessary recalculations

**Fix Required:** Use deep comparison or ensure `guildRoles` reference stability in parent/store.

---

## 📊 SUMMARY

**Critical Issues:** 5  
**High Priority:** 3  
**Medium Priority:** 2  
**Total Issues:** 10

### Priority Actions:
1. ✅ Fix memory leaks in Overview.tsx (Issue #1)
2. ✅ Add request cancellation to Overview.tsx (Issue #2)
3. ✅ Fix toast timeout bug (Issue #4)
4. ✅ Fix toast memory leak (Issue #5)
5. ✅ Fix AuthCallback XSS risk (Issue #3)

### Recommended Next Steps:
1. Add AbortController support to all API methods
2. Implement consistent error handling pattern across components
3. Add cleanup functions to all useEffect hooks with async operations
4. Review and fix all localStorage/sessionStorage access patterns
5. Add request deduplication at component level (not just API level)

---

## ✅ POSITIVE FINDINGS

1. **Good:** Request deduplication implemented in API client (`lib/api/client.ts`)
2. **Good:** Proper error handling in stores with error state management
3. **Good:** TypeScript usage throughout codebase
4. **Good:** Zustand store pattern is well-implemented
5. **Good:** React Query-like patterns in hooks (useMyTrackers)

---

**Audit Completed:** 2025-01-02  
**Next Review:** After fixes are implemented
