# App Structure Migration Plan

**Date**: 2025-11-07  
**Status**: Ready to Execute  
**Branch**: `refactor/apps-structure-migration`  
**Backup Tag**: `pre-migration-backup-<timestamp>`

## Executive Summary

Migrate Political Sphere apps from current structure to intended structure as defined in `file-structure.md`. Migration uses Nx's built-in move generator to preserve import paths and git history.

## Current State

**Existing Apps** (8):

- `api` - Backend API service ✅ (no change needed)
- `worker` - Background job processor ✅ (no change needed)
- `game-server` - Real-time game simulation ✅ (no change needed)
- `frontend` → **needs rename to `web`**
- `host` → **needs rename to `shell`**
- `remote` → **needs rename to `feature-auth-remote`**
- `docs` ✅ (already exists, matches intended)
- `dev` ✅ (already exists, matches intended)
- `ci-automation` ⚠️ (not in intended structure, will remain)

**Missing Apps** (5 planned):

- `data` - Data processing/ETL service
- `infrastructure` - IaC provisioning/management
- `e2e` - End-to-end tests (Playwright)
- `load-test` - Performance testing (k6/Artillery)
- `feature-dashboard-remote` - Dashboard micro-frontend

## Migration Strategy

### Phase 1: Rename Existing Apps

Use `nx g @nx/workspace:move` to rename apps. This automatically:

- Updates all import paths across the codebase
- Updates `project.json` references
- Updates `nx.json` configuration
- Preserves git history

**Renames**:

```bash
frontend → apps/web
host → apps/shell
remote → apps/feature-auth-remote
```

### Phase 2: Generate New Apps

Use Nx generators to scaffold new apps with proper structure:

```bash
# Data ETL service
nx g @nx/node:application data --directory=apps/data

# Infrastructure tooling
nx g @nx/node:application infrastructure --directory=apps/infrastructure

# E2E tests
nx g @nx/playwright:configuration e2e --project=e2e

# Load testing
nx g @nx/node:application load-test --directory=apps/load-test

# Dashboard micro-frontend
nx g @nx/react:application feature-dashboard-remote --directory=apps/feature-dashboard-remote
```

### Phase 3: Verification

- Build all apps: `nx run-many --target=build --all`
- Run all tests: `nx run-many --target=test --all`
- Generate dependency graph: `nx graph`
- Manual smoke test of critical paths

## Safety Measures

1. **Git Tag Backup**: Created before any changes
2. **Dedicated Branch**: All work in `refactor/apps-structure-migration`
3. **Incremental Commits**: Each phase committed separately
4. **Automated Rollback**: Script provided to restore to pre-migration state
5. **Verification Steps**: Builds and tests must pass before merge

## Rollback Procedure

If migration fails or causes issues:

```bash
./scripts/migrations/rollback-migration.sh
```

This will:

- Return to `main` branch
- Reset to backup tag
- Delete migration branch
- Restore exact pre-migration state

## Execution Command

```bash
./scripts/migrations/migrate-apps-to-intended-structure.sh
```

## Post-Migration Tasks

1. **Update CI/CD workflows** - Ensure build paths reference new app names
2. **Update documentation** - READMEs, deployment guides, runbooks
3. **Update environment configs** - `.env` files, deployment configs
4. **Notify team** - Communicate breaking changes (import paths)
5. **Merge to main** - After verification passes

## Risk Assessment

| Risk               | Likelihood | Impact   | Mitigation                                |
| ------------------ | ---------- | -------- | ----------------------------------------- |
| Import path breaks | Low        | High     | Nx move generator handles automatically   |
| Build failures     | Medium     | Medium   | Verification phase catches before merge   |
| Config mismatches  | Low        | Low      | Nx generators create proper configs       |
| Lost git history   | Very Low   | High     | Using `git mv` via Nx, history preserved  |
| Production impact  | Very Low   | Critical | Migration on branch, tested before deploy |

## Success Criteria

- ✅ All apps renamed/created per `file-structure.md`
- ✅ All builds passing
- ✅ All tests passing
- ✅ Nx dependency graph shows correct structure
- ✅ No import errors or broken references
- ✅ Documentation updated
- ✅ CI/CD pipelines working

## Timeline

- **Preparation**: 5 minutes (backup, branch creation)
- **Phase 1 (Renames)**: 10-15 minutes
- **Phase 2 (New Apps)**: 10-15 minutes
- **Phase 3 (Verification)**: 15-20 minutes
- **Total**: ~45 minutes

## Notes

- `ci-automation` app not in intended structure but will be preserved (may be legacy)
- Migration script handles missing generators gracefully
- Script includes colored output for easy progress tracking
- All changes are reversible via rollback script

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Approved By**: [Pending]  
**Executed By**: GitHub Copilot (AI Agent)  
**Execution Date**: [Pending]
