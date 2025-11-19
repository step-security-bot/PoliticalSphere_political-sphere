# Pre-Commit Hooks Developer Guide

**Version:** 4.0.0  
**Target Audience:** All contributors  
**Last Updated:** 2025-11-17

## Quick Start

### Installation

```bash
# 1. Install Lefthook (if not already installed)
brew install lefthook  # macOS
# OR
go install github.com/evilmartians/lefthook@latest  # Go

# 2. Install pre-commit dependencies
bash scripts/setup-pre-commit-deps.sh

# 3. Install Git hooks
lefthook install

# 4. Test your setup
git add . && git commit -m "test: validate hooks"
```

### Your First Commit

```bash
# Standard commit (all quality gates)
git add src/components/Button.tsx
git commit -m "feat(ui): add accessible button component"

# Fast iteration mode (reduced gates, dev only)
FAST_AI=1 git commit -m "wip: experimenting with styles"

# Use the branded Political Sphere commit wrapper
git ps-commit -m "feat: add election simulation"
```

## Execution Modes

### Standard Mode (Default)

**When:** Production commits, feature development, pre-PR  
**Gates:** All security + quality + governance + infrastructure  
**Target:** P95 <20 seconds

```bash
git commit -m "feat(voting): implement ranked choice voting"
```

**What runs:**

- ✅ Secrets scanning (gitleaks)
- ✅ Dependency security (npm audit high/critical)
- ✅ License compliance
- ✅ Code formatting (Biome → Prettier fallback)
- ✅ Linting (ESLint --max-warnings 0)
- ✅ Type checking (TypeScript strict mode)
- ✅ Accessibility validation (17 WCAG 2.2 AA rules)
- ✅ Test quality gates (no .only(), assertions present)
- ✅ Documentation linting (markdownlint)
- ✅ Change budget validation
- ✅ Infrastructure validation (actionlint, hadolint, YAML/JSON)

### Fast-Secure Mode (Development)

**When:** Rapid iteration, WIP commits, experimental work  
**Gates:** Security + quality only, relaxed governance  
**Target:** P95 <10 seconds

```bash
FAST_AI=1 git commit -m "wip: testing approach"
```

**What runs:**

- ✅ Secrets scanning (CRITICAL - always enforced)
- ⚠️ Dependency security (bypassed with warning)
- ⚠️ License compliance (advisory only)
- ✅ Code formatting (auto-fix)
- ✅ Linting (auto-fix)
- ✅ Type checking
- ✅ Accessibility validation
- ❌ Docs linting (skipped)
- ❌ Change budget (skipped)
- ❌ Infrastructure validation (skipped)

**⚠️ IMPORTANT:** Never use `FAST_AI=1` for:

- Commits to `main` branch
- Production deployments
- Release candidates
- Security-sensitive changes

### Audit Mode (Compliance)

**When:** Release preparation, compliance audits, security reviews  
**Gates:** All gates + telemetry + evidence capture  
**Target:** No time limit (completeness over speed)

```bash
AUDIT_MODE=1 git commit -m "release: v2.0.0"
```

**What runs:**

- All Standard Mode gates
- PLUS:
  - ✅ Structured telemetry logging
  - ✅ Change budget enforcement (strict)
  - ✅ Artefact validation (CHANGELOG, TODO, SBOM)
  - ✅ Evidence capture for audit trail

**Telemetry output:** `logs/pre-commit-telemetry.jsonl` (JSONL format)

### CI Mode (Automated Pipelines)

**When:** GitHub Actions workflows, automated testing  
**Gates:** All gates, non-interactive, structured logs

```bash
CI=1 git commit -m "ci: automated deployment"
```

**Behavior:**

- All gates enforced
- No interactive prompts
- Structured JSON logging
- Parallel execution optimized for runners

## Emergency Bypass (⚠️ Use With Caution)

### Skip All Hooks

```bash
# EMERGENCY ONLY - requires post-facto review
LEFTHOOK=0 git commit -m "hotfix: critical production issue"
```

**⚠️ Requirements:**

- Document reason in commit message
- Create follow-up issue for post-commit review
- Run full validation manually: `lefthook run pre-commit`
- Get approval from security team for sensitive changes

### Skip Specific Hook

```bash
# Skip only one hook (e.g., during tool installation)
LEFTHOOK_EXCLUDE=secrets-scan git commit -m "chore: update .gitleaks.toml"
```

**Valid use cases:**

- Updating hook configuration files
- Installing new security tools
- Troubleshooting specific tool failures

**Invalid use cases:**

- Avoiding legitimate violations
- Speeding up commits
- Circumventing quality standards

## Hook Phases Explained

### Phase 0: Initialization (Priority -100)

**Purpose:** Set up execution mode, generate trace ID, initialize telemetry

**Duration:** <100ms

**Skippable:** NO (required for all other phases)

### Phase 1: Critical Security (Priority 0)

**Purpose:** Prevent secrets leaks, vulnerable dependencies, license violations

**Duration:** 2-4 seconds

**Skippable:** NO (constitutional requirement)

**Tools:**

- gitleaks (secret scanning)
- npm audit (dependency vulnerabilities)
- license-checker (SPDX compliance)

**Failure modes:**

- **Secrets detected:** Commit BLOCKED, immediate credential rotation required
- **High/critical CVE:** Commit BLOCKED in standard/audit mode, warning in fast mode
- **License incompatible:** Advisory warning (proceed with manual review)

### Phase 2: Code Quality (Priority 1)

**Purpose:** Enforce code standards, type safety, maintainability

**Duration:** 3-6 seconds

**Skippable:** NO (quality baseline)

**Tools:**

- Biome (fast formatter/linter)
- Prettier (fallback formatter)
- ESLint (linting with --max-warnings 0)
- TypeScript (strict mode type checking)

**Failure modes:**

- **Format errors:** Auto-fixed and re-staged
- **Lint errors:** Commit BLOCKED (must fix manually)
- **Type errors:** Commit BLOCKED (strict mode non-negotiable)

### Phase 3: Governance (Priority 2)

**Purpose:** Enforce accessibility, test quality, documentation standards

**Duration:** 2-5 seconds

**Skippable:** In FAST_AI mode only (except accessibility)

**Tools:**

- eslint-plugin-jsx-a11y (17 WCAG 2.2 AA rules)
- Custom test quality validator
- markdownlint (documentation linting)
- guard-change-budget.mjs (change governance)

**Failure modes:**

- **Accessibility violations:** Commit BLOCKED (WCAG 2.2 AA mandatory)
- **.only() in tests:** Commit BLOCKED (breaks CI)
- **Markdown issues:** Commit BLOCKED in standard mode, warning in fast mode
- **Budget exceeded:** Commit BLOCKED in audit mode only

### Phase 4: Infrastructure (Priority 3)

**Purpose:** Validate CI/CD configs, Dockerfiles, data files

**Duration:** 1-2 seconds

**Skippable:** In FAST_AI mode

**Tools:**

- actionlint (GitHub Actions YAML)
- hadolint (Dockerfile linting)
- jq (JSON validation)
- yamllint (YAML validation)

**Failure modes:**

- **Invalid workflow:** Commit BLOCKED (prevents CI failures)
- **Dockerfile violations:** Commit BLOCKED (security/best practices)
- **Malformed JSON/YAML:** Commit BLOCKED (parse errors)

### Phase 5: Finalization (Priority 999)

**Purpose:** Log telemetry, calculate duration, close trace

**Duration:** <100ms

**Skippable:** NO (required for observability)

## Troubleshooting

### Hook Execution Failed

```bash
# Verbose output for debugging
LEFTHOOK_VERBOSE=1 git commit -m "debug"

# Check Lefthook version
lefthook version  # Should be 1.7.0+

# Reinstall hooks
lefthook install
```

### Secrets Scan False Positive

1. Verify it's truly a false positive (test data, documentation example)
2. Update `.gitleaks.toml` allowlist with justification:

```toml
[[allowlist]]
description = "Test JWT secret in documentation"
paths = ["docs/examples/auth-flow.md"]
regexes = ["TEST_JWT_SECRET"]
```

3. Document in commit message: `docs: add auth examples (false positive allowlisted)`

### Accessibility Violations

**Common issues:**

```tsx
// ❌ BAD: No alt text
<img src="logo.png" />

// ✅ GOOD: Descriptive alt text
<img src="logo.png" alt="Political Sphere logo" />

// ❌ BAD: Non-semantic interactive element
<div onClick={handleVote}>Vote</div>

// ✅ GOOD: Semantic button with keyboard support
<button onClick={handleVote}>Vote</button>

// ❌ BAD: Missing label association
<label>Email</label>
<input type="email" />

// ✅ GOOD: Properly associated label
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

**Resources:**

- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- Project guide: `docs/05-engineering-and-devops/ui/ux-accessibility.md`

### Slow Hook Execution

```bash
# Measure performance
time git commit -m "test"

# Check telemetry data
cat logs/pre-commit-telemetry.jsonl | jq -s 'map(select(.event=="hook_complete")) | map(.duration_seconds) | sort'

# Use fast mode for rapid iteration
FAST_AI=1 git commit -m "wip"
```

**Performance baseline:**

- P50: ~8 seconds
- P95: ~15 seconds
- P99: ~22 seconds

**If consistently slower:**

1. Check system resources (CPU, disk I/O)
2. Clear caches: `rm -rf .nx/cache node_modules/.cache`
3. Update tools: `brew upgrade gitleaks actionlint hadolint`

### TypeScript Errors

```bash
# Full type check with details
npx tsc --noEmit

# Incremental build for speed
npx tsc --noEmit --incremental

# Check specific file
npx tsc --noEmit src/components/Button.tsx
```

**Common fixes:**

- Add explicit return types
- Use `unknown` instead of `any`
- Enable `skipLibCheck` temporarily for third-party type issues

### Markdown Linting Failures

```bash
# Auto-fix markdown issues
markdownlint --fix '**/*.md'

# Check specific file
markdownlint docs/README.md

# View rule details
markdownlint --help
```

**Common violations:**

- MD013: Line too long (max 100 chars for prose)
- MD024: Duplicate heading (siblings_only: true)
- MD033: HTML in markdown (allowed in this project)

## Performance Optimization

### File-Level Caching

Lefthook uses glob patterns to skip hooks when no matching files changed:

```yaml
# Only runs if TypeScript files changed
glob: '*.{ts,tsx}'
```

### Parallel Execution

Hooks in the same phase run in parallel where possible:

```yaml
pre-commit:
  parallel: true # Enable parallel execution
```

### Incremental Type Checking

TypeScript uses incremental mode for speed:

```bash
npx tsc --incremental  # Creates .tsbuildinfo cache
```

### Affected Files Only

Most hooks use `{staged_files}` to process only changed files:

```bash
npx eslint {staged_files}  # Not entire codebase
```

## Integration with CI

### GitHub Actions Parity

Pre-commit hooks mirror CI gates for fail-fast validation:

| Hook                | CI Equivalent          | Parity    |
| ------------------- | ---------------------- | --------- |
| secrets-scan        | Gitleaks workflow      | ✅ Full   |
| dependency-security | npm audit job          | ✅ Full   |
| lint-code           | lint-typecheck job     | ✅ Full   |
| typecheck           | lint-typecheck job     | ✅ Full   |
| accessibility-check | a11y-check job         | ✅ Full   |
| test-changed        | test-changed job       | 🔄 Subset |
| actionlint          | validate-workflows job | ✅ Full   |

**Philosophy:** Local validation catches 90%+ of CI failures before push.

### Bypassing Pre-commit in CI

CI workflows should NOT set `LEFTHOOK=0` (defeats purpose of local validation).

Use `CI=1` mode instead for optimized CI execution:

```yaml
# .github/workflows/ci.yml
- name: Run pre-commit checks
  run: |
    lefthook install
    CI=1 lefthook run pre-commit
```

## Telemetry Analysis

### View Telemetry Logs

```bash
# Pretty-print recent logs
cat logs/pre-commit-telemetry.jsonl | jq .

# Calculate P95 duration
cat logs/pre-commit-telemetry.jsonl | jq -s '
  map(select(.event=="hook_complete")) |
  map(.duration_seconds) |
  sort |
  .[length * 0.95 | floor]
'

# Count commits by mode
cat logs/pre-commit-telemetry.jsonl | jq -s '
  group_by(.mode) |
  map({mode: .[0].mode, count: length})
'
```

### Telemetry Schema

```jsonl
{"timestamp":"2025-11-17T14:32:10Z","trace_id":"abc-123","mode":"safe","event":"hook_start"}
{"timestamp":"2025-11-17T14:32:18Z","trace_id":"abc-123","duration_seconds":8,"event":"hook_complete"}
```

**Fields:**

- `timestamp`: ISO 8601 UTC
- `trace_id`: UUID v4 (correlates start/complete)
- `mode`: safe | fast-secure | audit | ci
- `event`: hook_start | hook_complete
- `duration_seconds`: Total execution time (complete events only)

## Conventional Commits Reference

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Purpose                               | Example                             |
| ---------- | ------------------------------------- | ----------------------------------- |
| `feat`     | New feature                           | `feat(voting): add ranked choice`   |
| `fix`      | Bug fix                               | `fix(auth): resolve token expiry`   |
| `docs`     | Documentation only                    | `docs(api): update endpoints`       |
| `style`    | Code style (no logic change)          | `style: apply prettier`             |
| `refactor` | Code restructure (no behavior change) | `refactor(db): extract repository`  |
| `perf`     | Performance improvement               | `perf(query): add index on user_id` |
| `test`     | Tests only                            | `test(voting): add edge cases`      |
| `build`    | Build system/dependencies             | `build: upgrade react to 19.x`      |
| `ci`       | CI configuration                      | `ci: add accessibility workflow`    |
| `chore`    | Maintenance tasks                     | `chore: update .gitignore`          |
| `revert`   | Revert previous commit                | `revert: feat(voting)`              |

### Scopes (Examples)

- `voting`, `auth`, `ui`, `api`, `db`, `docs`, `infra`, `a11y`

### Rules

1. **Title length:** 10-100 characters
2. **Format:** Must match conventional commits pattern
3. **Case:** Lowercase type and scope
4. **No WIP on main:** `wip:` commits blocked on `main` branch
5. **Issue references:** Encouraged (`#123` or `Closes #123`)

### Examples

```bash
# Feature with scope
git commit -m "feat(election): implement multi-winner voting"

# Bug fix with issue reference
git commit -m "fix(api): validate JWT expiry (#456)"

# Documentation update
git commit -m "docs: add pre-commit troubleshooting guide"

# Breaking change
git commit -m "feat(auth)!: migrate to OAuth 2.1

BREAKING CHANGE: Legacy token format no longer supported"

# Multi-line with body
git commit -m "refactor(db): extract user repository

- Separate database logic from business logic
- Add comprehensive error handling
- Improve test coverage to 95%

Closes #789"
```

## Best Practices

### DO ✅

- Commit early and often
- Use descriptive commit messages
- Run hooks locally before pushing
- Fix violations immediately (don't accumulate)
- Keep changes small (<300 lines for standard commits)
- Test hooks after configuration changes
- Use `FAST_AI=1` for rapid WIP iterations (dev branch only)
- Document false positives in allowlists
- Review telemetry for performance degradation

### DON'T ❌

- Use `LEFTHOOK=0` except emergencies
- Commit secrets (even encrypted)
- Bypass accessibility checks
- Push with `.only()` in tests
- Use `FAST_AI=1` for production commits
- Ignore linting errors
- Skip type errors
- Commit broken code "to fix later"

## Getting Help

### Resources

- **Full architecture:** `docs/05-engineering-and-devops/development/pre-commit-architecture-v4.md`
- **Project docs:** `docs/`
- **Lefthook docs:** https://github.com/evilmartians/lefthook
- **WCAG guidelines:** https://www.w3.org/WAI/WCAG22/quickref/

### Debugging Commands

```bash
# Verbose hook execution
LEFTHOOK_VERBOSE=1 git commit

# Check hook configuration
lefthook dump

# Validate configuration syntax
lefthook run --no-tty pre-commit

# View installed hooks
cat .git/hooks/pre-commit

# Check tool versions
gitleaks version
npx eslint --version
npx tsc --version
markdownlint --version
```

### Common Issues

**Issue:** "gitleaks not installed"  
**Solution:** `brew install gitleaks` (macOS) or see installation docs

**Issue:** "Accessibility violations detected"  
**Solution:** See [Accessibility Violations](#accessibility-violations) section

**Issue:** "Type errors found"  
**Solution:** Run `npx tsc --noEmit` for details, fix strict mode violations

**Issue:** "Change budget exceeded"  
**Solution:** Split into smaller commits or use `FAST_AI=1` for WIP (dev only)

**Issue:** "Hook execution slow"  
**Solution:** See [Slow Hook Execution](#slow-hook-execution) section

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Last Updated:** 2025-11-17  
**Maintained By:** DevOps Team  
**Feedback:** Create issue with label `git-hooks`
