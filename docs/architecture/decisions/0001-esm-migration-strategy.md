# ESM Migration Strategy - Hybrid Approach

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Status**: Accepted
**Date**: 2025-11-11
**Decision Makers**: Solo Developer + AI Assistants

## Context

The codebase has mixed CommonJS (`require()`) and ESM (`import`) modules, causing 21,000+ linting errors and blocking CI/CD pipelines. All `/apps/api/**/*.js` files use CommonJS, while newer `.ts` files use ESM.

## Decision

Adopt a **hybrid incremental migration** approach:

1. **Phase 1 (COMPLETED)**: Add ESLint overrides to allow CommonJS in legacy files
2. **Phase 2 (IN PROGRESS)**: Incrementally convert files to ESM by priority order
3. **Phase 3 (FUTURE)**: Complete migration and remove ESLint overrides

## Consequences

**Positive**:

- Unblocks CI/CD immediately
- Reduces migration risk through incremental approach
- Allows feature development to continue
- Aligns with "small changes > big rewrites" principle

**Negative**:

- Temporary mixed codebase state
- Requires tracking migration progress
- Developers must know which style to use in each file

## Migration Priority Order

1. Standalone utilities (`/apps/api/src/utils/**`)
2. Stores (`/apps/api/src/stores/**`)
3. Routes (`/apps/api/src/routes/**`)
4. Main application files (`/apps/api/src/app.js`, `/apps/api/src/server.js`)

## Alternatives Considered

- **Full immediate migration**: Too risky, time-consuming
- **Permanent CommonJS**: Creates technical debt, misses ESM benefits

## References

- ESLint config changes: `eslint.config.js` lines 93-102
- Migration tracking: `docs/TODO.md`
