# CI/CD Overview

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |    Status    |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :----------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Approved** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

This document describes the CI/CD (Continuous Integration and Continuous Delivery) system for the Political Sphere project. It covers workflows, scripts, best practices, and improvement plans.

## Structure

- **Workflows:** Located in `.github/workflows/` (e.g., `ci.yml`, `deploy.yml`, `security.yml`, `gitleaks.yml`, etc.)
- **Scripts:** Located in `scripts/`, `apps/dev/scripts/`, and `libs/ci/` for automation, seeding, migration, and boundary checks.
- **Makefile:** Provides developer-friendly targets for common tasks.
- **Nx Project:** `ci/project.json` (currently unused)

## Key Workflows

- **ci.yml:** Main CI pipeline (lint, typecheck, test, build, security scan)
- **deploy.yml:** Handles deployment to staging/production
- **release.yml:** Automates semantic releases
- **security.yml:** Runs security audits, CodeQL, dependency review
- **gitleaks.yml:** Scans for secrets
- **lint-boundaries.yml:** Checks for import boundary violations

## Key Scripts

- `scripts/ci/check-import-boundaries.js|sh`: Custom import boundary checkers
- `scripts/security/gitleaks-scan.sh`: Runs gitleaks via Docker
- `scripts/migrate/run-migrations.sh`: Runs Prisma migrations across packages
- `scripts/seed/seed.sh`: Seeds the database using psql
- `apps/dev/scripts/dev-up.sh|dev-down.sh|dev-service.sh`: Orchestrate local dev stack

## Recent Improvements (2025-10-29)

The following improvements have been implemented:

### ✅ Boundary Linting Integration

- Added `lint:import-boundaries` npm script that invokes custom boundary checker
- Updated `lint-boundaries.yml` workflow to use the new script
- Boundary violations now generate actionable reports in `artifacts/`

### ✅ Makefile Targets for CI

- Added `make ci-checks` - runs all CI checks (lint, typecheck, test, boundaries)
- Added `make security-scan` - runs security audits and gitleaks
- Added `make test-all` - runs unit, integration, and e2e tests

### ✅ Deduplicated CI Workflows

- Created reusable composite actions in `.github/actions/`:
  - `setup-node-deps` - Sets up Node.js and installs dependencies
  - `quality-checks` - Runs lint, typecheck, and boundary checks
- Refactored all workflows to use composite actions (DRY principle)

### ✅ Enhanced Test Coverage

- Added explicit `integration-test` job to `ci.yml`
- Added explicit `e2e-test` job to `ci.yml`
- Added coverage upload to Codecov in test job

### ✅ Accessibility Testing

- Created `scripts/ci/a11y-check.sh` using axe-core and Playwright
- Added `test:a11y` npm script
- Added `accessibility-test` job to CI workflow

### ✅ Improved Error Handling

- Enhanced `scripts/seed/seed.sh` with clear error messages and connection tests
- Enhanced `scripts/migrate/run-migrations.sh` with dependency checks and summary reporting
- Enhanced `apps/dev/scripts/dev-service.sh` with validation and helpful error messages

### ✅ Enhanced Nx CI Project

- Added useful targets to `ci/project.json` (lint, typecheck, test, security-scan, ci-checks)
- Created `ci/README.md` documenting purpose and usage
- CI project now provides Nx-compatible entry points for automation

## Usage Examples

### Running CI Checks Locally

```bash
# Run all CI checks (recommended before pushing)
make ci-checks

# Run security scans
make security-scan

# Run all tests (unit + integration + e2e)
make test-all

# Run specific checks
npm run lint
npm run typecheck
npm run test
npm run lint:import-boundaries
npm run test:a11y
```

### Using Nx Targets

```bash
# Run via Nx
nx run ci:ci-checks
nx run ci:lint
nx run ci:security-scan
```

### CI Workflow Jobs

The main `ci.yml` workflow now includes:

1. **lint-and-typecheck** - Code quality checks
2. **test** - Unit tests with coverage upload
3. **build** - Build all applications
4. **security-scan** - Security audits, CodeQL, dependency review
5. **integration-test** - Integration tests
6. **e2e-test** - End-to-end tests
7. **accessibility-test** - Automated accessibility validation

## Configuration

### Secrets Required

- `CODECOV_TOKEN` - For coverage uploads (optional, won't fail CI if missing)
- `AWS_ACCOUNT_ID` - For deployment workflows
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

### Environment Variables

- `BASE_URL` - Base URL for accessibility and e2e tests (default: http://localhost:3000)
- `FAST_AI` - Set to `1` to skip heavy quality gates during local AI-assisted development

## Monitoring & Reports

All workflows upload artifacts for review:

- **test-results** - Code coverage reports (`coverage/`)
- **build-artifacts** - Compiled application bundles (`dist/`)
- **integration-test-results** - Integration test results
- **e2e-test-results** - Playwright HTML reports
- **accessibility-report** - Axe accessibility scan results
- **import-boundary-report** - Boundary violation details
- **gitleaks-report** - Secret scan results

Artifacts are retained for 30 days.

---

**For project-level details, see [README.md](../../../README.md).**
**For CI project documentation, see [ci/README.md](../../../ci/README.md).**
