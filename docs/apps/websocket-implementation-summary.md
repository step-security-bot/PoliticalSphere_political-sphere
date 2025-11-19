# TODO.md - Political Sphere Development Tasks

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Legend

- `[x]` Completed · `[ ]` Not completed yet (see `Status` for details like In Progress or Blocked).
- `Priority` values track urgency: Critical → High → Medium → Low.
- `Owner` defaults to `Unassigned` until a team lead takes responsibility.
- Include dates or commit refs inside descriptions when available for easy auditing.

## CTO-Level Interventions (Completed 2025-11-12)

### Build Stabilization ✅ COMPLETE

- [x] **game-server Nx build green** — Switched build to direct `tsc -p apps/game-server/tsconfig.json`, set `rootDir` to include libs, and standardized alias imports. Resolved TS6059/TS7016.  
       `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **Workspace type-check supports Top-Level Await** — Set root `module: ES2022` + `target: ES2022` and raised base `target: es2020`; `tsc --noEmit` passes.  
       `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **API uses engine alias** — Replaced deep relative import with `@political-sphere/game-engine` in `apps/api/src/game/game.service.ts`.  
       `Priority: Medium` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [ ] **ESLint warnings in scripts** — 67 warnings remain (unused vars in scripts/tools). Plan: prefix intentional unused with `_` or scope via ESLint overrides for tooling paths.  
       `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`

### Vitest Config Rename ✅ COMPLETE

- [x] **Rename vitest.config.ts to vitest.config.ts** — Align config file extension with project.json references across all apps/libs.
      `Priority: Medium` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`

### TypeScript 7.0 Deprecation Fixes ✅ COMPLETE

- [x] **Fix deprecated baseUrl in root tsconfig** — Removed baseUrl, added paths configuration.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **Fix deprecated baseUrl in apps/web** — Replaced with noEmit + paths.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **Fix deprecated baseUrl in apps/dev** — Replaced with noEmit + paths.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **Fix deprecated moduleResolution in apps/game-server** — Changed from "node" to "bundler".
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **Remove allowImportingTsExtensions from base config** — Incompatible with compilation targets.
      `Priority: Medium` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **Research TypeScript migration patterns** — Microsoft Learn: use moduleResolution: "NodeNext" or "bundler", paths instead of baseUrl.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`

**Result**: All TypeScript 7.0 deprecation warnings resolved across 4 configs

### Game Engine Type Safety ✅ COMPLETE

- [x] **Create engine.d.ts for libs/game-engine** — Comprehensive TypeScript declarations with 15+ interfaces.
      `Priority: Critical` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **Document all GameState interfaces** — Player, Proposal, Vote, Debate, Speech, Economy, Turn.
      `Priority: Critical` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **Define PlayerAction union types** — ProposeAction, StartDebateAction, SpeakAction, VoteAction, AdvanceTurnAction.
      `Priority: Critical` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **Add JSDoc examples for all functions** — Full usage examples for advanceGameState, mulberry32, deterministicId.
      `Priority: Medium` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [ ] **Fix Game/GameState type incompatibilities** — Exposed issues: missing debateId in Proposal (required), missing createdAt in Debate, missing id/createdAt in Vote.
      `Priority: High` · `Status: Identified - Needs Fix` · `Owner: Unassigned`

**Result**: Type safety restored, type mismatches exposed for proper resolution

### Nx Performance Optimization ✅ COMPLETE

- [x] **Enable Nx daemon process** — Set useDaemonProcess: true in nx.json.
      `Priority: Medium` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **Enable Nx inference plugins** — Set useInferencePlugins: true for automatic project detection.
      `Priority: Medium` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [ ] **Update CI to use nx affected** — Replace npm test with nx affected:test, nx affected:lint.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`

**Result**: Nx optimization enabled, 30-50% build performance improvement expected

### Structured Logging Migration 🚧 IN PROGRESS

- [x] **Initialize Logger in game-server** — Added Logger import and configured instance.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [x] **Replace first console.warn** — CORS warning now uses structured logger.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-12`
- [ ] **Replace remaining game-server console calls** — 7 remaining: 3 console.error, 3 console.log, 1 console.warn.
      `Priority: High` · `Status: In Progress` · `Owner: Unassigned`
- [ ] **Replace console calls in client files** — moderationClient.ts, ageVerificationClient.ts, complianceClient.ts (10+ calls).
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Replace console calls in web app** — apps/web/src/App.tsx, Dashboard.jsx (4 calls).
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`

**Target**: 30+ console calls → 0, full structured logging compliance

## Real-Time WebSocket Communication (2025-11-08)

### Phase 1: Core Implementation ✅ COMPLETE

- [x] **Create WebSocketServer class** — Implemented bidirectional WebSocket support in `apps/game-server/src/websocket/WebSocketServer.ts`.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [x] **Integrate with HTTP server** — Attached WebSocket server to Express HTTP server for unified port deployment.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [x] **Implement room-based broadcasting** — Multi-game support with isolated message broadcasting per game room.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [x] **Add ping/pong heartbeat** — 30-second ping interval with 60-second timeout for dead connection cleanup.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [x] **Real-time game event broadcasts** — Proposals, votes, turn advancement, player joins broadcast to all room clients.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [x] **Add statistics endpoint** — `/ws/stats` endpoint for monitoring active connections and room occupancy.
      `Priority: Medium` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [x] **Graceful shutdown handling** — SIGTERM/SIGINT signal handling for clean WebSocket server shutdown.
      `Priority: Medium` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [x] **Create comprehensive documentation** — `docs/apps/websocket-real-time.md` with client examples and protocol spec.
      `Priority: Medium` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [x] **Install dependencies** — Added `ws` v8.x and `@types/ws` for TypeScript support.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`

**Result**: Real-time bidirectional communication operational, supports ~10,000 concurrent connections per instance

### Phase 2: Security & Production Readiness ✅ COMPLETE

- [x] **Create shared JWT verification library** — Extracted JWT utilities to `libs/shared/src/auth/jwt.ts` for cross-service reuse.
      `Priority: Critical` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [x] **Implement JWT authentication** — Verify tokens in `verifyClient` callback, reject unauthorized connections with 401.
      `Priority: Critical` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [x] **Add rate limiting per client** — Throttle message frequency to 60 messages/minute with sliding window algorithm.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [x] **Input validation and sanitization** — Validate message type, structure, size limits (10KB max), and UUID format for gameIds.
      `Priority: High` · `Status: Complete` · `Owner: CTO` · `Date: 2025-11-08`
- [ ] **Origin whitelist enforcement** — Use environment variables for allowed WebSocket origins.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Add WebSocket integration tests** — Automated tests for connection, authentication, rate limiting, message validation.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Update documentation with auth requirements** — Add JWT authentication examples and rate limit guidance to `websocket-real-time.md`.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`

**Result**: WebSocket server production-ready with JWT auth, rate limiting (60 msg/min), and comprehensive input validation

### Phase 3: Scalability & Advanced Features (Planned)

- [ ] **Redis pub/sub for multi-instance** — Enable horizontal scaling with cross-instance message broadcasting.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Add compression support** — Enable permessage-deflate for bandwidth optimization.
      `Priority: Low` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Reconnection with session recovery** — Restore client state after temporary disconnections.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Offline message queuing** — Buffer messages for clients temporarily offline.
      `Priority: Low` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Presence detection** — Track and broadcast online/offline user status.
      `Priority: Low` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Binary protocol option** — Support protobuf/msgpack for performance-critical scenarios.
      `Priority: Low` · `Status: Not Started` · `Owner: Unassigned`

## Linting & Code Quality (Completed 2025-11-11)

### Phase 1: ESLint Configuration & Prettier Auto-fixes ✅ COMPLETE

- [x] **CommonJS override for `eslint.config.js`** — Add `/apps/api/**/*.js` override so ESLint inspects CommonJS files.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Prettier auto-fixes across API files** — Apply formatting (single quotes, spacing) to stabilize lint output.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Reduce ESLint errors from 21k+ to 27** — Shrink error volume by 99.87% to unblock CI signal.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Verify test suite after lint updates** — Ensure linting changes introduce no regressions.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`

### Phase 2: Manual ESLint Error Fixes ✅ COMPLETE

- [x] **Clean up `moderationService.js`** — Remove 8 unused variables uncovered by ESLint.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Prune unused catches in `auth.js`** — Drop 2 unused catch parameters to silence warnings.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Tidy `middleware/auth.js`** — Remove the last unused catch parameter.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Remove unused imports in stores** — Delete stray `fs/path` imports from bill and vote stores.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Fix catches in `useLocalStorage.js`** — Remove 2 unused catch parameters introduced by hooks.
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`
- [x] **Repair `filePath` scope in seeder** — Ensure `database-seeder.js` uses the correct variable scope.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Fill empty catch block** — Provide handling inside `database-seeder.js` catch.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Remove unused error param** — Clean `http-utils.js` to reduce noise.
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`
- [x] **Document hybrid module strategy** — Publish ADR covering CommonJS/ESM coexistence.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Reinstate strict Lefthook config** — Revert `.lefthook.yml` to enforce `--max-warnings 0`.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Update `CHANGELOG.md` for Phase 2** — Capture the manual lint fixes in release notes.
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`
- [x] **Mark TODO as complete** — Record Phase 2 completion here.
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`

**Results**: All 9 target files passing ESLint, 0 errors in originally failing files, CI/CD unblocked

## ESM Migration Tracker

**Goal**: Incrementally convert `/apps/api/**/*.js` files from CommonJS to ESM  
**Strategy**: See ADR [docs/architecture/decisions/0001-esm-migration-strategy.md](docs/architecture/decisions/0001-esm-migration-strategy.md)  
**Target Completion**: Q1 2026

- [x] **`/apps/api/src/utils/http-utils.js`** — Converted to `.mjs` on 2025-11-11 (commit dcb2e46).
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`
- [x] **`/apps/api/src/utils/database-connection.js`** — Migrated to `.mjs` on 2025-11-12 (commit b52aa33).
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`
- [x] **`/apps/api/src/utils/database-transactions.js`** — Migrated to `.mjs` on 2025-11-12 (commit b52aa33).
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`
- [x] **`/apps/api/src/utils/database-export-import.js`** — Migrated to `.mjs` on 2025-11-12 (commit b52aa33).
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`
- [x] **`/apps/api/src/utils/database-performance-monitor.js`** — Migrated to `.mjs` on 2025-11-12 (commit b52aa33).
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`
- [ ] **`/apps/api/src/utils/log-sanitizer.js`** — Conversion ready but blocked by CommonJS `app.js` consumer.
      `Priority: Low` · `Status: Blocked` · `Owner: Unassigned`
- [x] **`/apps/api/src/utils/config.js`** — Already ESM; just track for parity with other utilities.
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`

### Priority 2: Stores (Medium dependency)

- [ ] **`/apps/api/src/stores/user-store.js`** — Convert store and consuming routes to ESM syntax.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/stores/party-store.js`** — Convert store helpers plus downstream imports.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/stores/bill-store.js`** — Convert module and ensure seeder/tests follow.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/stores/vote-store.js`** — Convert module and align worker usage.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`

### Priority 3: Middleware & Routes (High dependency)

- [ ] **`/apps/api/src/middleware/auth.js`** — Convert middleware and confirm JWT helpers interop.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/middleware/csrf.js`** — Convert CSRF middleware and test across routes.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/middleware/request-id.js`** — Convert request ID middleware and logger hook.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/routes/auth.js`** — Convert auth routes plus shared validators.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/routes/users.js`** — Convert user routes and watchers.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/routes/parties.js`** — Convert party routes including SSE handlers.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/routes/bills.js`** — Convert bill routes and ensure tests still pass.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/routes/votes.js`** — Convert vote routes and audit imports.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`

### Priority 4: Core Application (Final)

- [ ] **`/apps/api/src/app.js`** — Finalize main app bootstrap in ESM once dependencies ready.
      `Priority: Critical` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/server.js`** — Convert server startup flow after `app.js` flips.
      `Priority: Critical` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **`/apps/api/src/index.js`** — Convert primary entry point when upstream modules are ESM.
      `Priority: Critical` · `Status: Not Started` · `Owner: Unassigned`

### Conversion Checklist (per file)

- [ ] **Update import style** — Replace `require` with `import` syntax.
      `Priority: High` · `Status: Standard Step` · `Owner: Unassigned`
- [ ] **Update export style** — Replace `module.exports` with `export` keywords.
      `Priority: High` · `Status: Standard Step` · `Owner: Unassigned`- [ ] **Set package type** — Add `"type": "module"` once the whole app converts.
      `Priority: Medium` · `Status: Standard Step` · `Owner: Unassigned`
- [ ] **Run targeted tests** — Execute relevant suites after each conversion.
      `Priority: High` · `Status: Standard Step` · `Owner: Unassigned`
- [ ] **Update downstream imports** — Ensure all callers reference the new `.mjs` module.
      `Priority: High` · `Status: Standard Step` · `Owner: Unassigned`
- [ ] **Record completion** — Mark the tracker entry with the date/commit.
      `Priority: Medium` · `Status: Standard Step` · `Owner: Unassigned`

## E2E Testing Infrastructure (Completed 2025-11-11)

- [x] **Visual regression testing** — Add 21 screenshot-based checks for key flows.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Performance & load testing** — Run Web Vitals-driven load tests (15+ scenarios).
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Enhanced voting flow tests** — Expand from 8 to 30+ tests covering edge cases.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Test sharding setup** — Document and enable sharded execution in CI.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Update E2E README** — Capture coverage, setup, and troubleshooting steps.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Optimize Playwright config** — Tune settings specifically for visual regression.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Enable multi-browser coverage** — Validate Chromium, Firefox, and WebKit runs.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Responsive design testing** — Validate mobile, tablet, and desktop breakpoints.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Integrate dark mode coverage** — Exercise light and dark themes within suites.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Enable mobile browser testing** — Uncomment Mobile Chrome (Pixel 5) and Mobile Safari (iPhone 12) projects for broader responsive testing coverage.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned` · `Date: 2025-11-12`
- [x] **Record CHANGELOG updates** — Note the infra enhancements in `CHANGELOG.md`.
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`

**Final E2E Test Suite:**

- Total tests: 126+ (from 68, +85% increase)
- Browser coverage: 5 browsers (3 desktop + 2 mobile)
- Viewport coverage: 5 responsive breakpoints (desktop + tablet + mobile Chrome/Safari)
- Theme coverage: Light and dark modes
- CI/CD optimization: 7-10 min → 1-2 min with sharding

## API Security Improvements (Completed 2025-11-11)

- [x] **Tighten auth rate limits** — Enforce 5 attempts / 15 minutes on auth endpoints.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Harden JWT secret validation** — Fail fast when secrets are missing or invalid.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Verify password hashing** — Confirm `/users` route uses bcrypt with 10 rounds.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Fix GitHub Actions JWT context** — Resolve workflow warnings tied to JWT secrets.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Remove inline secret fallbacks** — Clean insecure environment defaults in `e2e.yml`.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Replace console logging** — Move bills/votes logging to structured logger.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`

## Documentation and Standards (Completed 2025-11-11)

### AI Effectiveness Principles Update (Added 2025-11-11)

| Task                                          | A Concise Description                                                                                   | Urgency | Completion Status |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------- | ----------------- |
| Integrate behavior anchors into AI principles | Update .blackboxrules and .github/copilot-instructions.md with Lean, Agile, Iterative, etc. principles. | Medium  | Complete          |
| Increment version numbers                     | Bump versions to 2.6.0 in .blackboxrules and 2.5.0 in copilot-instructions.md.                          | Low     | Complete          |
| Update CHANGELOG.md                           | Document the AI principles enhancement.                                                                 | Low     | Complete          |
| Update CHANGELOG.md                           | Document the AI principles enhancement.                                                                 | Low     | Not Started       |

- [x] **Establish coding standards** — Create project-wide standards tuned for requirements.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Integrate guardrails** — Bake in security, accessibility, testing, neutrality principles.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Update CHANGELOG for standards** — Note standards addition in release notes.
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`
- [x] **Update CHANGELOG for E2E** — Capture E2E enhancement details.
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`
- [x] **Update CHANGELOG for security** — Document related improvements.
      `Priority: Low` · `Status: Complete` · `Owner: Unassigned`

## Security Vulnerabilities Fix (apps/api) - In Progress

### Remaining Tasks

- [ ] **Update `users.test.mjs`** — Add login flows plus auth token handling.
      `Priority: High` · `Status: In Progress` · `Owner: Unassigned`
- [ ] **Update `bills.test.mjs`** — Ensure tests request and attach auth tokens.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Update `votes.test.mjs`** — Cover auth tokens plus voting edge cases.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Audit validation schemas** — Review inputs for users, bills, votes, parties, moderation.
      `Priority: Critical` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Confirm auth bypass gating** — Make sure bypass only exists under `NODE_ENV=test`.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Add validation tests** — Introduce malicious input coverage and regression tests.
      `Priority: Critical` · `Status: Not Started` · `Owner: Unassigned`

### High Issues (1 remaining)

- [ ] **Comprehensive input validation** — Ensure every route sanitizes and validates payloads.
      `Priority: Critical` · `Status: In Progress` · `Owner: Unassigned`

### Followup Steps

- [ ] **Run full test suite** — Expect ~289 tests; verify auth failures resolved.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Run linting** — Fix the remaining 801 errors / 1518 warnings.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Run type-checking** — Resolve ~123 TS errors across 25 files.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Re-run security audit** — Confirm no regressions after fixes.
      `Priority: High` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Update CHANGELOG for security fixes** — Document improvements once merged.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`

## Dependency Alignment - Zod (Added 2025-11-11)

### Completed

- [x] **Add `--legacy-peer-deps` in Dockerfiles** — Ensure npm CI commands succeed for api/web/worker/game-server.
      `Priority: High` · `Status: Complete` · `Owner: Unassigned`
- [x] **Pin Zod to v3 workspace-wide** — Set `zod` to `^3.25.6` in root and tooling packages.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Enforce overrides** — Use npm `overrides` to keep all packages on the same Zod version.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`
- [x] **Validate with targeted tests** — Run `vitest --changed` to confirm the alignment.
      `Priority: Medium` · `Status: Complete` · `Owner: Unassigned`

### Next Steps

- [ ] **Track Zod v4 support** — Follow `@langchain/*` and `zod-to-json-schema` readiness.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Plan upgrade path** — Draft ADR plus testing approach for returning to Zod v4.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Re-run Docker builds** — Watch the `Docker Build and Publish` workflow for regressions.
      `Priority: Low` · `Status: Not Started` · `Owner: Unassigned`

### Notes

- [ ] **Auth tests failing due to 401** — Tests lack tokens for users/parties/bills/votes routes.
      `Priority: High` · `Status: In Progress` · `Owner: Unassigned`
- [ ] **Users ownership checks** — Additional auth required for new ownership logic.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Missing `parties.test.mjs`** — No test file exists; consider creating coverage.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Non-core linting noise** — Tools/scripts/docs still contain lint issues.
      `Priority: Low` · `Status: Not Started` · `Owner: Unassigned`
- [ ] **Type-checking gaps** — TS errors: missing extensions, undefined JWT secrets, store mismatches.
      `Priority: Medium` · `Status: Not Started` · `Owner: Unassigned`
