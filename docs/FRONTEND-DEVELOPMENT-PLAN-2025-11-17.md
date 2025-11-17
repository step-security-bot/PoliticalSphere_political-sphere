# Frontend Development Plan - 2025-11-17

## Executive Summary

Comprehensive plan to connect the Political Sphere frontend to the backend API, implement missing features, and create a fully functional user experience.

---

## Current State Analysis

### ✅ What's Already Built

**Authentication Infrastructure:**
- ✅ AuthContext with login/register/logout methods
- ✅ API client service with token management and refresh
- ✅ Login component (WCAG 2.2 AA compliant)
- ✅ Register component (WCAG 2.2 AA compliant)
- ✅ Protected route logic in App.tsx

**Game System Components:**
- ✅ ParliamentChamber component (485 lines, fully styled)
- ✅ GovernmentDashboard component
- ✅ JudiciarySystem component
- ✅ MediaSystem component
- ✅ ElectionsManager component
- ✅ UserProfile component
- ✅ Lobby component

**API Integration:**
- ✅ Comprehensive API client (60+ endpoints)
- ✅ Token refresh logic
- ✅ Error handling
- ✅ All game system endpoints defined

### ❌ What Needs Work

**Critical Issues:**
1. Login/Register components use direct fetch instead of AuthContext
2. API client register method signature mismatch (needs username, not displayName)
3. Lobby uses different API client (api-client.ts vs api.ts)
4. Game components not connected to real API
5. No error boundaries
6. No loading states in game components
7. No WebSocket integration for real-time updates

---

## Implementation Plan

### Phase 1: Fix Authentication Flow (Priority: CRITICAL)

#### Task 1.1: Update Login Component
**File:** `apps/web/src/components/Auth/Login.tsx`
**Changes:**
- Replace direct fetch with useAuth hook
- Update onLoginSuccess signature to match App.tsx expectations
- Add proper error handling from AuthContext
- Improve accessibility announcements

#### Task 1.2: Update Register Component  
**File:** `apps/web/src/components/Auth/Register.tsx`
**Changes:**
- Replace direct fetch with useAuth hook
- Add username field (required by backend)
- Update API call to match backend schema
- Add password confirmation field
- Improve validation feedback

#### Task 1.3: Fix API Client Registration
**File:** `apps/web/src/services/api.ts`
**Changes:**
- Update register method signature: `(username, email, password)`
- Match backend RegisterSchema requirements
- Fix token storage after registration

#### Task 1.4: Update AuthContext
**File:** `apps/web/src/contexts/AuthContext.tsx`
**Changes:**
- Update register method signature
- Add username to User interface
- Improve error messages
- Add loading states

### Phase 2: Connect Lobby to Backend (Priority: HIGH)

#### Task 2.1: Consolidate API Clients
**Action:** Remove duplicate api-client.ts, use api.ts everywhere
**Files:**
- Delete `apps/web/src/utils/api-client.ts`
- Update Lobby.tsx to use `api` from services/api.ts
- Add missing game management endpoints to api.ts

#### Task 2.2: Implement Game Management API
**File:** `apps/web/src/services/api.ts`
**Add Methods:**
```typescript
async listGames(): Promise<ApiResponse>
async getMyGames(): Promise<ApiResponse>
async createGame(name: string, settings?: any): Promise<ApiResponse>
async joinGame(gameId: string): Promise<ApiResponse>
async leaveGame(gameId: string): Promise<ApiResponse>
async getGameState(gameId: string): Promise<ApiResponse>
```

#### Task 2.3: Update Lobby Component
**File:** `apps/web/src/components/Lobby.tsx`
**Changes:**
- Use consolidated API client
- Add proper error boundaries
- Improve loading states
- Add game filtering/search
- Add logout functionality using AuthContext

### Phase 3: Connect Game Components (Priority: HIGH)

#### Task 3.1: Update ParliamentChamber
**File:** `apps/web/src/components/Parliament/ParliamentChamber.tsx`
**Changes:**
- Connect to real API endpoints
- Implement motion creation flow
- Implement voting flow
- Add real-time vote updates
- Add error handling
- Add loading states

#### Task 3.2: Update GovernmentDashboard
**File:** `apps/web/src/components/Government/GovernmentDashboard.tsx`
**Changes:**
- Connect to government API endpoints
- Implement cabinet management
- Implement executive actions
- Add confidence vote UI
- Add error handling

#### Task 3.3: Update ElectionsManager
**File:** `apps/web/src/components/Elections/ElectionsManager.tsx`
**Changes:**
- Connect to elections API
- Implement candidate registration
- Implement voting interface
- Add results display
- Add error handling

#### Task 3.4: Update JudiciarySystem
**File:** `apps/web/src/components/Judiciary/JudiciarySystem.tsx`
**Changes:**
- Connect to judiciary API
- Implement case filing
- Implement ruling display
- Add error handling

#### Task 3.5: Update MediaSystem
**File:** `apps/web/src/components/Media/MediaSystem.tsx`
**Changes:**
- Connect to media API
- Implement press releases
- Implement opinion polls
- Add approval ratings
- Add error handling

### Phase 4: Enhance MainGame Component (Priority: MEDIUM)

#### Task 4.1: Update MainGame
**File:** `apps/web/src/components/MainGame.tsx`
**Changes:**
- Load real game state from API
- Implement tab navigation between systems
- Add game status display
- Add turn management
- Add player list
- Add chat interface (placeholder)
- Add error boundaries

#### Task 4.2: Add Game State Management
**Create:** `apps/web/src/contexts/GameContext.tsx`
**Features:**
- Centralized game state
- WebSocket connection management
- Real-time updates
- Optimistic UI updates

### Phase 5: Add Missing Features (Priority: MEDIUM)

#### Task 5.1: Error Boundary Component
**Create:** `apps/web/src/components/common/ErrorBoundary.tsx`
**Features:**
- Catch React errors
- Display user-friendly messages
- Log errors for debugging
- Provide recovery options

#### Task 5.2: Loading Component
**Create:** `apps/web/src/components/common/Loading.tsx`
**Features:**
- Consistent loading UI
- Accessibility compliant
- Multiple sizes/variants
- Skeleton screens

#### Task 5.3: Toast Notification System
**Create:** `apps/web/src/components/common/Toast.tsx`
**Features:**
- Success/error/info/warning types
- Auto-dismiss
- Accessibility announcements
- Queue management

#### Task 5.4: Confirmation Dialog
**Create:** `apps/web/src/components/common/ConfirmDialog.tsx`
**Features:**
- Reusable confirmation UI
- Keyboard navigation
- Focus management
- Accessibility compliant

### Phase 6: WebSocket Integration (Priority: LOW)

#### Task 6.1: WebSocket Service
**Create:** `apps/web/src/services/websocket.ts`
**Features:**
- Connection management
- Automatic reconnection
- Event subscription
- Heartbeat/ping-pong

#### Task 6.2: Real-time Updates
**Update:** All game components
**Features:**
- Subscribe to game events
- Update UI on events
- Optimistic updates
- Conflict resolution

---

## Implementation Order

### Week 1: Authentication & Lobby (Days 1-3)
1. **Day 1**: Fix authentication flow (Tasks 1.1-1.4)
2. **Day 2**: Connect Lobby to backend (Tasks 2.1-2.3)
3. **Day 3**: Test end-to-end auth and lobby flow

### Week 2: Game Systems (Days 4-8)
4. **Day 4**: Connect Parliament system (Task 3.1)
5. **Day 5**: Connect Government system (Task 3.2)
6. **Day 6**: Connect Elections system (Task 3.3)
7. **Day 7**: Connect Judiciary and Media (Tasks 3.4-3.5)
8. **Day 8**: Update MainGame component (Tasks 4.1-4.2)

### Week 3: Polish & Features (Days 9-12)
9. **Day 9**: Add common components (Tasks 5.1-5.4)
10. **Day 10**: Implement WebSocket (Tasks 6.1-6.2)
11. **Day 11**: Testing and bug fixes
12. **Day 12**: Documentation and deployment prep

---

## Success Criteria

### Phase 1 Complete:
- ✅ Users can register with username/email/password
- ✅ Users can log in with email/password
- ✅ Tokens stored and refreshed automatically
- ✅ Auth state persists across page reloads

### Phase 2 Complete:
- ✅ Users can see available games
- ✅ Users can create new games
- ✅ Users can join existing games
- ✅ Game list updates automatically

### Phase 3 Complete:
- ✅ Parliament system fully functional
- ✅ Government system fully functional
- ✅ Elections system fully functional
- ✅ Judiciary system fully functional
- ✅ Media system fully functional

### Phase 4 Complete:
- ✅ MainGame shows real game state
- ✅ Tab navigation works
- ✅ Turn management functional
- ✅ Error boundaries catch errors

### Phase 5 Complete:
- ✅ Loading states everywhere
- ✅ Error messages user-friendly
- ✅ Toast notifications working
- ✅ Confirmation dialogs functional

### Phase 6 Complete:
- ✅ WebSocket connected
- ✅ Real-time updates working
- ✅ Automatic reconnection
- ✅ No polling needed

---

## Technical Debt to Address

1. **TypeScript Strictness**: Enable strict mode, fix all `any` types
2. **Testing**: Add unit tests for all components
3. **Accessibility**: Full WCAG 2.2 AA audit
4. **Performance**: Code splitting, lazy loading
5. **Mobile**: Responsive design improvements
6. **Internationalization**: i18n setup for future localization

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| API endpoints not matching frontend expectations | High | Medium | Create API contract tests |
| WebSocket connection issues | Medium | High | Implement fallback polling |
| State management complexity | High | Medium | Use React Context + reducers |
| Performance with many updates | Medium | Medium | Implement debouncing/throttling |
| Browser compatibility | Low | Low | Use modern build tools, polyfills |

---

## Metrics to Track

- **Test Coverage**: Target 80%+ for critical paths
- **Bundle Size**: Keep under 500KB gzipped
- **Load Time**: First Contentful Paint < 1.5s
- **Accessibility**: 100% WCAG 2.2 AA compliance
- **Error Rate**: < 1% of user sessions
- **API Response Time**: p95 < 500ms

---

**Status**: Ready to implement
**Priority**: CRITICAL - Blocking user access
**Owner**: AI Development Agent
**Estimated Time**: 12 days (3 weeks part-time)
**Next Action**: Start with Phase 1, Task 1.1
