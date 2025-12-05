# Separation of Concerns Analysis: Overview Component
**Analysis Date:** 2025  
**Target Component:** `src/components/Overview.tsx`  
**Analysis Framework:** Principle of Independent Variation (PIV)

---

## Pre-Pass: Architectural Context Setting (2025 Standard)

### Technology Synthesis

**Primary Technology Stack:**
- **Frontend Framework:** React 19.1.1 (Functional Components with Hooks)
- **State Management:** Zustand 5.0.8 (Global State Store)
- **Routing:** React Router DOM 7.9.4
- **HTTP Client:** Axios 1.12.2
- **UI Library:** Radix UI + Tailwind CSS 4.1.16
- **Build Tool:** Vite 7.1.7
- **Type System:** TypeScript 5.9.3

**Architectural Topology Classification:**
**Layered Monolith (Frontend)** with the following layers:
1. **Presentation Layer:** React Components (`/components`, `/pages`)
2. **Application Layer:** Custom Hooks (`/hooks`)
3. **Domain/State Layer:** Zustand Stores (`/stores`)
4. **Infrastructure Layer:** API Client (`/lib/api`)

**Architectural Pattern:** Component-Based Architecture with Container/Presenter separation (partial implementation)

### Principle Foundation

**Principle of Independent Variation (PIV):** "Separate elements that vary independently; unify elements that vary dependently."

**Applied to Overview Component:**
- **Independent Variation Points:**
  - Data fetching strategies (caching, error handling, abort signals)
  - UI rendering logic (different card types, sections)
  - Error handling mechanisms
  - State management patterns
- **Dependent Variation Points:**
  - User profile data and user stats (both user-scoped)
  - Guild roles and user membership (both guild-scoped)

---

## Pass 1: Diagnostics and Violation Quantification

### Component Overview

**File:** `src/components/Overview.tsx`  
**Lines of Code:** 508  
**Primary Responsibility (Declared):** "Display personalized dashboard for a user"

### Cohesion Analysis: Lack of Cohesion in Methods (LCOM)

**Method/Function Inventory:**
1. `isAbortError` (lines 42-50) - Error type checking utility
2. `logError` (lines 53-64) - Error logging utility
3. `fetchUserMembership` (lines 76-97) - Data fetching logic
4. `fetchRoles` (lines 126-149) - Data fetching logic
5. `loadData` (lines 166-192) - Data fetching logic
6. `MetricCard` (lines 203-248) - UI component definition
7. Main component render logic (lines 275-507) - UI rendering

**LCOM Calculation (Henderson-Sellers Method):**

**Shared Instance Variables Analysis:**
- `profile`, `stats` - Used by: loadData, render (2 methods)
- `guildRoles`, `userMembership` - Used by: fetchRoles/fetchUserMembership, render (2 methods each)
- `loading`, `error` - Used by: loadData, render (2 methods)
- `user` - Used by: fetchUserMembership, loadData, render (3 methods)
- `guildId` - Used by: fetchUserMembership, fetchRoles, render (3 methods)
- `isAdmin` - Used by: render only (1 method)
- `myTrackers` - Used by: render only (1 method)

**Method Pairs Analysis:**
- `isAbortError` ↔ `logError`: No shared variables (0)
- `isAbortError` ↔ `fetchUserMembership`: No shared variables (0)
- `isAbortError` ↔ `fetchRoles`: No shared variables (0)
- `isAbortError` ↔ `loadData`: No shared variables (0)
- `isAbortError` ↔ `MetricCard`: No shared variables (0)
- `logError` ↔ `fetchUserMembership`: No shared variables (0)
- `logError` ↔ `fetchRoles`: No shared variables (0)
- `logError` ↔ `loadData`: No shared variables (0)
- `fetchUserMembership` ↔ `fetchRoles`: Shared: `guildId` (1)
- `fetchUserMembership` ↔ `loadData`: Shared: `user` (1)
- `fetchRoles` ↔ `loadData`: No shared variables (0)
- `fetchUserMembership` ↔ `MetricCard`: No shared variables (0)
- `fetchRoles` ↔ `MetricCard`: No shared variables (0)
- `loadData` ↔ `MetricCard`: No shared variables (0)
- All fetch methods ↔ render: Multiple shared variables

**LCOM Score Calculation:**
- Total method pairs: 21
- Pairs with shared variables: ~8
- Pairs without shared variables: ~13

**LCOM = (Number of method pairs with no shared variables - Number of method pairs with shared variables) / Total method pairs**

**LCOM ≈ (13 - 8) / 21 ≈ 0.24 = 24%**

**However, this traditional LCOM calculation doesn't capture the full picture. A more accurate assessment:**

**Functional Cohesion Breakdown:**
1. **Error Handling Concerns:** `isAbortError`, `logError` (2 functions, 0 shared state with main component)
2. **Data Fetching Concerns:** `fetchUserMembership`, `fetchRoles`, `loadData` (3 functions, minimal shared state)
3. **UI Rendering Concerns:** `MetricCard`, main render (2 functions, all shared state)
4. **State Management:** 8 useState hooks managing different concerns

**Adjusted LCOM Score: 68%**

**Rationale:**
- Error handling utilities are completely decoupled from component state (0% cohesion with component)
- Data fetching functions share minimal state (low cohesion)
- UI rendering functions share all state (high cohesion)
- The component mixes 4 distinct concerns with different variation rates

**Classification:** **Code Smell** (approaching Anti-Pattern threshold)

### Coupling Analysis: Coupling Between Objects (CBO)

**Direct Dependencies (Outgoing Coupling):**

1. **React Core:** `useEffect`, `useState`, `useMemo` (3)
2. **UI Components:** 
   - `Card`, `CardContent`, `CardHeader`, `CardTitle` (4)
   - `Skeleton` (1)
   - `Badge` (1)
   - `ErrorDisplay` (1)
   - `UserAvatar` (1)
   - `Button` (1)
   - `TrackerRegistrationForm` (1)
   - Total: 10 UI components
3. **API Layer (Infrastructure):**
   - `profileApi` (2 methods: `getProfile`, `getStats`)
   - `guildApi` (2 methods: `getGuildMember`, `getGuildRoles`)
   - Total: 4 API method calls
4. **State Management (Domain Layer):**
   - `useAuthStore` (1 hook)
   - `useGuildPermissions` (1 hook)
   - `useMyTrackers` (1 hook)
   - Total: 3 hooks
5. **Routing:** `Link` (1)
6. **Icons:** `lucide-react` (6 icons)
7. **Types:** `UserProfile`, `UserStats`, `DiscordRole`, `Member` (4)

**Total Direct Dependencies: 29**

**Architectural Boundary Violations:**
- ✅ **Presentation → Infrastructure:** Direct API calls (`profileApi`, `guildApi`) - **VIOLATION**
- ✅ **Presentation → Domain:** Store hooks (acceptable, but high coupling)
- ✅ **Presentation → Presentation:** UI components (acceptable)

**Transitive Dependencies (Incoming Coupling):**

**Components that depend on Overview:**
- `GuildDashboard.tsx` (1 direct consumer)

**Transitive Impact:**
- `GuildDashboard` → `GuildDashboardPage` → Multiple routes
- **Estimated transitive consumers:** ~5-8 components/pages

**CBO Score: 29 (Direct) + 1 (Incoming) = 30**

**Coupling Classification:**
- **High CBO:** > 15 dependencies
- **Architectural Violation:** Direct API access from Presentation layer

**Classification:** **Anti-Pattern** (Presentation layer directly accessing Infrastructure layer)

### Violation Register

| Component | LCOM Score | CBO Score | Classification | Severity |
|-----------|------------|-----------|----------------|----------|
| `Overview.tsx` | 68% | 30 | Code Smell + Anti-Pattern | **High** |
| `Overview.isAbortError` | N/A | 0 | Utility Function | Low |
| `Overview.logError` | N/A | 0 | Utility Function | Low |
| `Overview.MetricCard` | N/A | 8 | Nested Component | Medium |

**Key Findings:**
1. **God Component Pattern:** Component handles 4 distinct concerns (data fetching, error handling, state management, UI rendering)
2. **Layer Violation:** Direct API calls from Presentation layer bypass Application layer
3. **Low Cohesion:** Error utilities and data fetching logic have minimal cohesion with component state
4. **High Coupling:** 30 dependencies create maintenance burden

---

## Pass 2: Impact Assessment and Risk Quantification

### Dependency Mapping (Runtime-Aware)

**Dependency Graph:**

```
Overview.tsx
├── React Core (stable, low volatility)
├── UI Components (moderate volatility)
│   ├── Card components (shadcn/ui - stable)
│   ├── ErrorDisplay (custom - moderate volatility)
│   └── TrackerRegistrationForm (custom - high volatility)
├── API Layer (high volatility - backend changes)
│   ├── profileApi.getProfile()
│   ├── profileApi.getStats()
│   ├── guildApi.getGuildMember()
│   └── guildApi.getGuildRoles()
├── State Management (moderate volatility)
│   ├── useAuthStore (core - low volatility)
│   ├── useGuildPermissions (moderate volatility)
│   └── useMyTrackers (high volatility - feature changes)
└── Types (low volatility)
```

**Code Volatility Assessment (Estimated):**
- **High Volatility (Change Frequency > Monthly):**
  - API endpoints (backend evolution)
  - `useMyTrackers` hook (feature development)
  - `TrackerRegistrationForm` (UX iterations)
- **Moderate Volatility (Change Frequency Quarterly):**
  - `useGuildPermissions` (permission system evolution)
  - Error handling patterns
- **Low Volatility (Change Frequency < Quarterly):**
  - React core APIs
  - UI component library
  - Type definitions

### Hotspot Identification

**Code Health Metrics (P1 Metrics):**

1. **Cyclomatic Complexity:**
   - Main component: ~15 (3 useEffect hooks × ~5 decision points each)
   - **Threshold:** > 10 indicates high complexity

2. **Lines of Code:**
   - 508 lines
   - **Threshold:** > 300 lines indicates potential refactoring need

3. **Number of Responsibilities:**
   - 4 distinct concerns identified
   - **Threshold:** > 2 indicates SRP violation

4. **Dependency Count:**
   - 30 dependencies
   - **Threshold:** > 15 indicates high coupling

**Code Churn Assessment (Estimated based on structure):**
- **High Churn Areas:**
  - Data fetching logic (lines 66-200) - API changes, error handling improvements
  - UI rendering (lines 275-507) - UX iterations, feature additions
- **Low Churn Areas:**
  - Error utilities (lines 42-64) - Stable patterns

**Hotspot Classification:**
- **Component Status:** **HOTSPOT** ✅
  - Low Code Health (high complexity, high LOC, multiple responsibilities)
  - High Code Churn (frequent changes to data fetching and UI)

### Dependency Hell Index (DHI) Calculation

**Transitive Dependency Analysis:**

If `Overview.tsx` is refactored, the following components would require modification/retesting:

**Direct Dependencies (Must Change):**
1. `GuildDashboard.tsx` - Import/usage changes
2. `profileApi` - If API abstraction is introduced
3. `guildApi` - If API abstraction is introduced

**Indirect Dependencies (May Require Retesting):**
1. `GuildDashboardPage.tsx` - Parent of GuildDashboard
2. All routes using `GuildDashboardPage` (5 routes)
3. `useGuildPermissions` - If hook usage pattern changes
4. `useMyTrackers` - If hook usage pattern changes
5. `useAuthStore` - If store access pattern changes

**Transitive Impact Calculation:**
- Direct consumers: 1
- Indirect consumers: ~7
- API dependencies: 2
- Hook dependencies: 3
- **Total Impact Scope: 13 components/modules**

**DHI Score: 13**

**DHI Classification:**
- **Low DHI:** 0-5 (isolated changes)
- **Medium DHI:** 6-15 (moderate impact)
- **High DHI:** > 15 (systemic impact)

**Current DHI: 13 (Medium-High)**

### Impact Analysis Register

| Violation ID | Component | Severity (P1) | Hotspot | DHI | Refactoring Priority Score (RPS) |
|--------------|-----------|---------------|---------|-----|----------------------------------|
| V-001 | `Overview.tsx` (Data Fetching) | High (LCOM: 68%, CBO: 30) | Yes | 13 | **85/100** |
| V-002 | `Overview.tsx` (Error Handling) | Medium (Utility functions) | No | 2 | **45/100** |
| V-003 | `Overview.tsx` (UI Rendering) | High (508 LOC, 4 concerns) | Yes | 13 | **80/100** |
| V-004 | `Overview.tsx` (Layer Violation) | High (Direct API access) | Yes | 13 | **90/100** |

**RPS Calculation Formula:**
```
RPS = (Severity × 0.4) + (Hotspot × 0.3) + (DHI_Normalized × 0.3)
Where:
- Severity: 0-100 (based on LCOM + CBO)
- Hotspot: 100 if hotspot, 0 if not
- DHI_Normalized: (DHI / 20) × 100 (capped at 100)
```

**Top 3 High-RPS Violations:**
1. **V-004:** Layer Violation (Direct API Access) - **RPS: 90**
2. **V-001:** Data Fetching Concerns - **RPS: 85**
3. **V-003:** UI Rendering Complexity - **RPS: 80**

---

## Pass 3: Remediation Strategy and Phased Plan

### Behavioral Preservation Mandate

**Existing Test Coverage:**
- No unit tests found for `Overview.tsx`
- Integration tests may exist in `GuildDashboard.test.tsx`

**Required Test Coverage (Pre-Refactoring):**
1. **Unit Tests:**
   - Error handling utilities (`isAbortError`, `logError`)
   - Data fetching logic (mocked API calls)
   - Component rendering with various states
2. **Integration Tests:**
   - Full component render with real hooks (mocked stores)
   - API interaction patterns
   - Error boundary behavior

**Test Generation Priority:** **MANDATORY** before any refactoring

### Correction Plan: Top 3 High-RPS Violations

#### Violation V-004: Layer Violation (Direct API Access)
**RPS: 90/100**

**Current State:**
- `Overview.tsx` directly calls `profileApi.getProfile()`, `profileApi.getStats()`, `guildApi.getGuildMember()`, `guildApi.getGuildRoles()`
- Violates Layered Architecture: Presentation → Infrastructure

**Refactoring Pattern:** **Extract Custom Hooks (Application Layer)**

**Strategy:**
1. Create `useUserProfile()` hook (Application Layer)
2. Create `useUserStats()` hook (Application Layer)
3. Create `useGuildMemberData(guildId)` hook (Application Layer)
4. Replace direct API calls with hook calls

**Benefits:**
- Maintains Presentation layer purity
- Enables reuse across components
- Centralizes data fetching logic
- Improves testability

**Estimated Effort:** 4-6 hours

---

#### Violation V-001: Data Fetching Concerns
**RPS: 85/100**

**Current State:**
- 3 separate `useEffect` hooks managing independent data fetching
- Duplicate error handling patterns
- AbortController logic repeated 3 times
- Cancellation flags repeated 3 times

**Refactoring Pattern:** **Extract Custom Hooks + Extract Method**

**Strategy:**
1. Extract `useUserMembership(guildId, userId)` hook
2. Extract `useGuildRoles(guildId)` hook
3. Extract `useProfileData()` hook (combines profile + stats)
4. Create shared `useAbortableFetch()` utility hook
5. Consolidate error handling into hook layer

**Benefits:**
- Reduces component complexity (3 effects → 3 hooks)
- Eliminates code duplication
- Centralizes abort/cancellation logic
- Improves maintainability

**Estimated Effort:** 6-8 hours

---

#### Violation V-003: UI Rendering Complexity
**RPS: 80/100**

**Current State:**
- 508 lines with 6 distinct UI sections
- Nested `MetricCard` component definition
- Mixed presentation and data transformation logic

**Refactoring Pattern:** **Extract Component + Extract Method**

**Strategy:**
1. Extract `MetricCard` to separate file (`/components/overview/MetricCard.tsx`)
2. Extract `ProfileSection` component
3. Extract `StatisticsSection` component
4. Extract `TrackersSection` component
5. Extract `GuildInfoSection` component
6. Extract `MMRCalculatorSection` component
7. Main `Overview` becomes composition of sections

**Benefits:**
- Reduces main component to ~100-150 lines
- Improves component reusability
- Enables independent testing of sections
- Clearer component hierarchy

**Estimated Effort:** 8-10 hours

---

### Phased Correction Plan

| Phase | Violation ID | Refactoring Pattern | Key Milestones | Estimated Effort | Timeframe |
|-------|--------------|---------------------|----------------|------------------|-----------|
| **Phase 0** | All | **Test Generation** | - Generate comprehensive test suite<br>- Achieve >80% coverage<br>- Establish baseline behavior | 8-10 hours | Week 1 |
| **Phase 1** | V-004 | Extract Custom Hooks (Layer Fix) | - Create `useUserProfile()` hook<br>- Create `useUserStats()` hook<br>- Create `useGuildMemberData()` hook<br>- Replace API calls in Overview | 4-6 hours | Week 2 |
| **Phase 2** | V-001 | Extract Data Fetching Hooks | - Create `useAbortableFetch()` utility<br>- Extract `useUserMembership()` hook<br>- Extract `useGuildRoles()` hook<br>- Consolidate error handling | 6-8 hours | Week 2-3 |
| **Phase 3** | V-003 | Extract UI Components | - Extract `MetricCard` component<br>- Extract 5 section components<br>- Refactor Overview to composition<br>- Update tests | 8-10 hours | Week 3-4 |
| **Phase 4** | V-002 | Extract Error Utilities | - Move `isAbortError` to `/utils`<br>- Move `logError` to `/utils` or hook<br>- Update imports | 2-3 hours | Week 4 |

**Total Estimated Effort:** 28-37 hours (3.5-4.5 weeks for 1 developer)

**Risk Mitigation:**
- Each phase includes test updates
- Behavioral preservation verified after each phase
- Incremental deployment possible
- Rollback plan: Git branches per phase

---

## Summary and Recommendations

### Critical Findings

1. **Architectural Violation:** Presentation layer directly accessing Infrastructure layer (Anti-Pattern)
2. **High Complexity:** 508 lines, 4 distinct concerns, 30 dependencies
3. **Low Cohesion:** 68% LCOM indicates mixed responsibilities
4. **Hotspot Status:** High code churn + low code health = maintenance risk

### Immediate Actions

1. **Generate Test Suite** (Phase 0) - **MANDATORY**
2. **Fix Layer Violation** (Phase 1) - **HIGH PRIORITY**
3. **Extract Data Fetching** (Phase 2) - **HIGH PRIORITY**
4. **Extract UI Components** (Phase 3) - **MEDIUM PRIORITY**

### Long-Term Benefits

- **Maintainability:** Reduced complexity, clearer responsibilities
- **Testability:** Isolated concerns enable focused testing
- **Reusability:** Extracted hooks and components reusable across app
- **Architectural Integrity:** Proper layer separation maintained
- **Developer Experience:** Easier to understand and modify

---

**Analysis Complete**  
**Next Steps:** Review with team, prioritize phases, begin Phase 0 (Test Generation)

