# Immediate Action Plan - Political Sphere
**Date**: 2025-11-14  
**Priority**: CRITICAL  
**Estimated Time**: 4-6 hours

## 🔴 Critical Blockers (Fix Today)

### 1. TypeScript Compilation Errors (16 errors) - 2 hours
**Impact**: Prevents clean builds, blocks deployment  
**Files Affected**:
- `apps/api/src/game/game.service.ts` (1 error)
- `apps/game-server/src/index.ts` (15 errors)

**Root Cause**: Game/GameState interface mismatches

**Action Items**:
```typescript
// Fix 1: Update GameState interface in libs/game-engine/src/engine.d.ts
interface GameState {
  // Add missing properties
  turn: number;
  updatedAt: string;
  contentRating?: string;
  moderationEnabled: boolean;
  ageVerificationRequired: boolean;
  // ... existing properties
}

// Fix 2: Make Vote.createdAt required (not optional)
interface Vote {
  id: string;
  userId: string;
  billId: string;
  vote: 'yes' | 'no' | 'abstain';
  createdAt: string; // Remove undefined
}

// Fix 3: Standardize Proposal.status to union type
interface Proposal {
  status: 'proposed' | 'rejected' | 'debate' | 'voting' | 'enacted';
  // ... other properties
}

// Fix 4: Add null checks in apps/game-server/src/index.ts
const newProposal = createProposal(gameState, action.proposal);
if (!newProposal) {
  throw new Error('Failed to create proposal');
}
```

**Verification**:
```bash
npm run type-check
# Should show 0 errors
```

---

### 2. WebSocket Test Failures (13 tests) - 1 hour
**Impact**: Real-time game features untested, potential production issues  
**Files Affected**: `apps/game-server/src/websocket/WebSocketServer.test.ts`

**Root Cause**: JWT initialization failing in test environment

**Action Items**:
1. Update test setup to properly initialize JWT:
```typescript
// In beforeEach
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.JWT_REFRESH_SECRET = TEST_JWT_SECRET;

// Initialize JWT before creating server
import { initializeJWTFromEnv } from '@political-sphere/shared';
initializeJWTFromEnv();
```

2. Mock JWT functions if initialization fails:
```typescript
import { vi } from 'vitest';

vi.mock('@political-sphere/shared', async () => {
  const actual = await vi.importActual('@political-sphere/shared');
  return {
    ...actual,
    initializeJWTFromEnv: vi.fn(),
    verifyAuthHeader: vi.fn(() => ({ valid: true, payload: { userId: 'test' } })),
  };
});
```

**Verification**:
```bash
npm test -- apps/game-server/src/websocket/WebSocketServer.test.ts
# Should show 13/13 passing
```

---

### 3. Remaining ESLint Errors (29 errors) - 1 hour
**Impact**: Code quality issues, potential bugs  
**Categories**:
- Unused variables (15 errors)
- Import restrictions (5 errors)
- Empty blocks (3 errors)
- Other (6 errors)

**Action Items**:

**Quick Fixes** (prefix unused vars with underscore):
```bash
# Find all unused variable errors
npm run lint 2>&1 | grep "is defined but never used"

# Fix pattern: Rename 'error' to '_error', 'e' to '_e', etc.
```

**Import Restrictions** (libs/ai-system patterns):
```typescript
// Current (restricted):
import { types } from '../../types';

// Fix: Use absolute imports
import { types } from '@political-sphere/ai-system/types';
```

**Empty Blocks**:
```typescript
// Current:
try {
  // ...
} catch (error) {}

// Fix:
try {
  // ...
} catch (error) {
  // Intentionally ignored - [reason]
}
```

**Verification**:
```bash
npm run lint
# Should show 0 errors, only warnings acceptable
```

---

## 🟡 High Priority (Fix This Week)

### 4. Input Validation Audit - 3 hours
**Security Impact**: HIGH - Potential XSS, SQL injection  
**Scope**: All API routes (users, bills, votes, parties, moderation)

**Action Items**:
1. Audit each route handler:
```bash
# Check for missing validation
grep -r "router.post\|router.put" apps/api/src/routes/
```

2. Add Zod schemas for all endpoints:
```typescript
import { z } from 'zod';

const CreateBillSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  proposerId: z.string().uuid(),
  // ... all fields
});

// In route handler
const validated = CreateBillSchema.parse(req.body);
```

3. Add validation tests:
```typescript
describe('Input Validation', () => {
  it('should reject XSS attempts', async () => {
    const malicious = { title: '<script>alert("xss")</script>' };
    const res = await request(app).post('/bills').send(malicious);
    expect(res.status).toBe(400);
  });
  
  it('should reject SQL injection', async () => {
    const malicious = { title: "'; DROP TABLE bills; --" };
    const res = await request(app).post('/bills').send(malicious);
    expect(res.status).toBe(400);
  });
});
```

**Verification**:
```bash
npm test -- apps/api/tests/integration/security.test.mjs
# All validation tests should pass
```

---

### 5. Install Missing Type Definitions - 5 minutes
**Impact**: TypeScript warnings, reduced type safety

**Action Items**:
```bash
npm install --save-dev @types/ws
```

**Verification**:
```bash
npm run type-check
# Should show no warnings about 'ws' module
```

---

### 6. Fix Remaining Test Failures (5 tests) - 2 hours
**Impact**: Incomplete test coverage, potential bugs

**Action Items**:
1. Identify failing tests:
```bash
npm test 2>&1 | grep "FAIL"
```

2. Debug each failure:
```bash
npm test -- <failing-test-file> --reporter=verbose
```

3. Fix or document:
- Fix if bug in code
- Update test if expectations wrong
- Skip if flaky (document in test file)

**Verification**:
```bash
npm test
# Should show 290/290 passing (100%)
```

---

## 📊 Success Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| TypeScript Errors | 16 | 0 | 🔴 Critical |
| Test Pass Rate | 93.8% | 100% | 🟡 Good |
| ESLint Errors | 29 | 0 | 🟡 Fixable |
| WebSocket Tests | 0/13 | 13/13 | 🔴 Critical |
| Input Validation | Incomplete | Complete | 🟡 In Progress |

---

## 🎯 Today's Goals (4-6 hours)

**Morning (2-3 hours)**:
1. ✅ Fix TypeScript errors (2 hours)
2. ✅ Fix WebSocket tests (1 hour)

**Afternoon (2-3 hours)**:
3. ✅ Fix ESLint errors (1 hour)
4. ✅ Install @types/ws (5 min)
5. ✅ Start input validation audit (1-2 hours)

**End of Day**:
- TypeScript: 0 errors ✅
- Tests: 100% passing ✅
- ESLint: 0 errors ✅
- Input validation: 50%+ complete 🟡

---

## 📝 Notes

**Blockers**:
- None identified

**Dependencies**:
- All fixes can be done independently
- No external dependencies required

**Risks**:
- Type fixes may reveal additional issues
- WebSocket test fixes may require architecture changes
- Input validation audit may uncover security issues

**Mitigation**:
- Test thoroughly after each fix
- Document any new issues found
- Create follow-up tasks for complex issues

---

## 🔄 Next Steps After Completion

1. Run full test suite: `npm test`
2. Run full build: `npm run build`
3. Update TODO.md with completed items
4. Update CHANGELOG.md with fixes
5. Create PR with all changes
6. Deploy to staging for validation

---

**Assigned To**: AI Assistant + Human Developer  
**Review Date**: 2025-11-14 EOD  
**Follow-up**: 2025-11-15 (address any issues found)
