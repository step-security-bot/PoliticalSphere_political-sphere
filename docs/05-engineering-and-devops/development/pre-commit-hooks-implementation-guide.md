---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

description: Comprehensive implementation guide for industry-standard pre-commit hooks using Lefthook
version: 1.0.0
status: READY_FOR_IMPLEMENTATION
created: 2025-11-17
author: AI Agent
applies_to: Repository-wide
---

# Pre-Commit Hooks Implementation Guide

**Version:** 1.0.0  
**Status:** READY_FOR_IMPLEMENTATION  
**Last Updated:** 2025-11-17

## Overview

1. [Executive Summary](#executive-summary)
2. [Prerequisites](#prerequisites)
3. [Implementation Checklist](#implementation-checklist)
4. [Phase 1: Enhanced Security Layer](#phase-1-enhanced-security-layer)
5. [Phase 2: Code Quality Layer](#phase-2-code-quality-layer)
6. [Phase 3: Governance Layer](#phase-3-governance-layer)
7. [Phase 4: Infrastructure Validation](#phase-4-infrastructure-validation)
8. [Phase 5: Commit Message Hooks](#phase-5-commit-message-hooks)
9. [Phase 6: Pre-Push Hooks](#phase-6-pre-push-hooks)
10. [Phase 7: Performance Optimization](#phase-7-performance-optimization)
11. [Phase 8: Documentation and Training](#phase-8-documentation-and-training)
12. [Validation and Testing](#validation-and-testing)
13. [Rollback Plan](#rollback-plan)

---

## Executive Summary

This guide implements an industry-standard pre-commit hook system based on:

- **Lefthook** (already installed) - Fast, parallel Git hooks manager
- **Security-first approach** - Gitleaks, secrets scanning, dependency validation
- **Zero-trust principles** - All inputs validated, no assumptions
- **Accessibility compliance** - WCAG 2.2 AA validation
- **Political neutrality** - Constitutional safeguard checks
- **Performance optimization** - Parallel execution, caching, incremental checks

**Key improvements over current implementation:**

1. ✅ Priority-based execution (fail-fast on critical errors)
2. ✅ Enhanced error messages with remediation steps
3. ✅ Dependency vulnerability scanning
4. ✅ License compliance checking
5. ✅ Accessibility linting integration
6. ✅ Performance benchmarking
7. ✅ CI/CD parity (hooks match CI checks)
8. ✅ Developer experience (auto-fix, clear feedback)

---

## Prerequisites

### Required Tools

```bash
# Security
brew install gitleaks                 # Secrets scanning (REQUIRED)

# Linting (choose one strategy)
npm install -g @biomejs/biome        # Fast linter (preferred)
# OR keep existing:
# npm install -g eslint prettier

# Infrastructure validation
brew install actionlint              # GitHub Actions validation
brew install hadolint                # Dockerfile linting
brew install yamllint                # YAML validation

# Optional but recommended
brew install jq                       # JSON validation
npm install -g license-checker       # License compliance
```

### Verification Commands

```bash
# Verify installations
command -v lefthook && echo "✓ Lefthook installed"
command -v gitleaks && echo "✓ Gitleaks installed"
command -v actionlint && echo "✓ Actionlint installed"
command -v hadolint && echo "✓ Hadolint installed"
```

---

## Implementation Checklist

### Pre-Implementation

- [ ] Backup current `.lefthook.yml`
- [ ] Review current hooks behavior
- [ ] Communicate changes to team
- [ ] Set up testing branch

### Core Implementation

- [ ] Phase 1: Enhanced Security Layer
- [ ] Phase 2: Code Quality Layer
- [ ] Phase 3: Governance Layer
- [ ] Phase 4: Infrastructure Validation
- [ ] Phase 5: Commit Message Hooks
- [ ] Phase 6: Pre-Push Hooks
- [ ] Phase 7: Performance Optimization

### Post-Implementation

- [ ] Phase 8: Documentation and Training
- [ ] Validation and Testing
- [ ] Team communication
- [ ] Monitoring setup

---

## Phase 0: Branding and User Experience

**Priority:** N/A (Cosmetic enhancement)  
**Execution:** First display

### Files to Modify

1. `.lefthook.yml` - Add banner/logo display

### Implementation Steps

#### Step 0.1: Add Political Sphere Banner

**File:** `.lefthook.yml`

**Insert at the very beginning of pre-commit section:**

```yaml
pre-commit:
  parallel: true

  commands:
    # Display banner
    banner:
      priority: -1 # Run first (before everything)
      run: |
        echo ""
        echo "╔══════════════════════════════════════════════════════════════════╗"
        echo "║                                                                  ║"
        echo "║                          ____  ____                              ║"
        echo "║                         |  _ \\/ ___|                            ║"
        echo "║                         | |_) \\___ \\                           ║"
        echo "║                         |  __/ ___) |                            ║"
        echo "║                         |_|   |____/                             ║"
        echo "║                                                                  ║"
        echo "║                 P O L I T I C A L   S P H E R E                  ║"
        echo "║                                                                  ║"
        echo "║                    ── Pre-Commit Validation ──                   ║"
        echo "║                                                                  ║"
        echo "╚══════════════════════════════════════════════════════════════════╝"
        echo ""
        echo "🔍 Running validation checks..."
        echo ""
```

**Alternative (Minimal version for faster execution):**

```yaml
# Display banner (minimal)
banner:
  priority: -1
  run: |
    echo ""
    echo "🌐 Political Sphere - Pre-Commit Validation"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
```

**Rationale:**

- Priority -1 ensures it runs before everything else
- Provides professional branding
- Sets context for validation messages that follow
- Minimal version available for performance-conscious teams

---

## Phase 1: Enhanced Security Layer

**Priority:** 0 (Critical - Blocking)  
**Execution:** Sequential fail-fast

### Files to Modify

1. `.lefthook.yml` - Main configuration
2. `.gitleaks.toml` - Gitleaks configuration (verify existing)
3. `tools/scripts/validation/validate-environment.mjs` - Environment validation script

### Implementation Steps

#### Step 1.1: Update Gitleaks Configuration

**File:** `.lefthook.yml`

**Current code (lines ~35-42):**

```yaml
# Security: Secret scanning
gitleaks:
  run: |
    if command -v gitleaks >/dev/null 2>&1; then
      gitleaks protect --staged --verbose --redact
    else
      echo "⚠️  gitleaks not installed (brew install gitleaks)"
    fi
```

**Replace with:**

```yaml
# Security: Secret scanning (BLOCKING)
gitleaks:
  priority: 0
  run: |
    if command -v gitleaks >/dev/null 2>&1; then
      gitleaks protect --staged --verbose --redact --exit-code 1
    else
      echo "❌ CRITICAL: gitleaks not installed"
      echo "Install: brew install gitleaks"
      echo "Or skip: LEFTHOOK_EXCLUDE=gitleaks git commit"
      exit 1
    fi
```

**Rationale:**

- Add explicit `--exit-code 1` to fail on detection
- Make missing gitleaks a critical error (not just warning)
- Provide clear remediation steps

#### Step 1.2: Add Dependency Vulnerability Scanning

**File:** `.lefthook.yml`

**Insert after gitleaks block (~line 50):**

```yaml
# Security: Dependency vulnerability scan (BLOCKING)
dependency-check:
  priority: 0
  glob: '{package.json,package-lock.json,pnpm-lock.yaml,yarn.lock}'
  run: |
    if git diff --cached --name-only | grep -E 'package.*\.json|.*lock.*'; then
      echo "📦 Scanning dependencies for vulnerabilities..."
      npm audit --audit-level=high --production || {
        echo ""
        echo "❌ High/Critical vulnerabilities found"
        echo "Fix: npm audit fix"
        echo "Review: npm audit"
        echo "Skip (not recommended): LEFTHOOK_EXCLUDE=dependency-check git commit"
        exit 1
      }
    fi
```

**Rationale:**

- Only runs when dependency files change
- Fails on high/critical vulnerabilities
- Production-only scope (dev dependencies excluded)
- Clear remediation guidance

#### Step 1.3: Add License Compliance Check

**File:** `.lefthook.yml`

**Insert after dependency-check (~line 65):**

```yaml
# Security: License compliance (ADVISORY)
license-check:
  priority: 0
  glob: 'package.json'
  run: |
    if git diff --cached --name-only | grep 'package.json'; then
      echo "⚖️  Checking license compatibility..."
      if command -v npx >/dev/null 2>&1; then
        npx license-checker \
          --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;0BSD' \
          --excludePrivatePackages \
          --summary || {
          echo "⚠️  Incompatible licenses detected"
          echo "Review: npx license-checker --summary"
          echo "Note: This is advisory - commit will proceed"
        }
      fi
    fi
```

**Rationale:**

- Advisory only (doesn't block commits)
- Whitelist common permissive licenses
- Excludes private packages
- Informational for compliance tracking

#### Step 1.4: Enhance Environment Validation

**File:** `.lefthook.yml`

**Current code (lines ~44-46):**

```yaml
# Security: Environment validation and secret detection
env-validation:
  run: node tools/scripts/validation/validate-environment.mjs --mode=scan --files {staged_files}
```

**Replace with:**

```yaml
# Security: Environment validation and secret detection (BLOCKING)
env-validation:
  priority: 0
  glob: '*.{ts,tsx,js,jsx,json,env*,sh,yml,yaml}'
  run: |
    node tools/scripts/validation/validate-environment.mjs \
      --mode=scan \
      --files {staged_files} \
      --fail-on-warning || {
      echo ""
      echo "❌ Environment validation failed"
      echo "Check for: hardcoded secrets, invalid env vars, missing required vars"
      echo "Fix issues before committing"
      exit 1
    }
```

**Rationale:**

- Add `--fail-on-warning` flag for stricter validation
- Limit to relevant file types
- Better error messaging

---

## Phase 2: Code Quality Layer

**Priority:** 1 (High - Auto-fix where possible)  
**Execution:** Parallel with staged file updates

### Implementation Steps

#### Step 2.1: Unified Format Strategy (Biome + Prettier Fallback)

**File:** `.lefthook.yml`

**Current code (lines ~17-20):**

```yaml
# Auto-fix code formatting
prettier:
  glob: '*.{ts,tsx,js,jsx,json,css,scss,md,yml,yaml}'
  run: npx prettier --write {staged_files}
  stage_fixed: true
```

**Replace with:**

```yaml
# Auto-fix code formatting (Biome preferred, Prettier fallback)
format:
  priority: 1
  glob: '*.{ts,tsx,js,jsx,json,css,scss,md,yml,yaml}'
  run: |
    if command -v biome >/dev/null 2>&1; then
      echo "🎨 Formatting with Biome..."
      biome format --write {staged_files}
    else
      echo "🎨 Formatting with Prettier..."
      npx prettier --write --log-level warn {staged_files}
    fi
  stage_fixed: true
```

**Rationale:**

- Prefer Biome (faster, single tool for format+lint)
- Fall back to Prettier if Biome unavailable
- Stage fixed files automatically

#### Step 2.2: Enhanced Linting with Biome Integration

**File:** `.lefthook.yml`

**Current code (lines ~22-25):**

```yaml
eslint:
  glob: '*.{ts,tsx,js,jsx}'
  run: npx eslint --fix --max-warnings 0 {staged_files}
  stage_fixed: true
```

**Replace with:**

```yaml
# Lint and fix code issues
lint:
  priority: 1
  glob: '*.{ts,tsx,js,jsx}'
  run: |
    # Biome for fast checks
    if command -v biome >/dev/null 2>&1; then
      echo "🔍 Linting with Biome..."
      biome check --apply {staged_files} 2>/dev/null || true
    fi
    # ESLint for deep analysis
    echo "🔍 Linting with ESLint..."
    npx eslint --fix --max-warnings 0 {staged_files} || {
      echo ""
      echo "❌ Linting errors found"
      echo "Fix: npx eslint --fix {staged_files}"
      echo "Review: npx eslint {staged_files}"
      exit 1
    }
  stage_fixed: true
```

**Rationale:**

- Run Biome first for fast fixes
- ESLint for comprehensive analysis
- Stage all fixes automatically
- Clear error messages

#### Step 2.3: Incremental TypeScript Type Checking

**File:** `.lefthook.yml`

**Current code (lines ~67-70):**

```yaml
# TypeScript validation
type-check:
  glob: '*.{ts,tsx}'
  run: npx tsc --noEmit --skipLibCheck
```

**Replace with:**

```yaml
# TypeScript validation (incremental)
type-check:
  priority: 1
  glob: '*.{ts,tsx}'
  run: |
    if [ -n "{staged_files}" ]; then
      echo "🔍 Type checking TypeScript files..."
      npx tsc --noEmit --skipLibCheck --incremental || {
        echo ""
        echo "❌ TypeScript type errors found"
        echo "Fix type errors before committing"
        echo "Run: npx tsc --noEmit"
        exit 1
      }
    fi
```

**Rationale:**

- Only run if TypeScript files changed
- Use incremental compilation (faster)
- Clear error messaging

#### Step 2.4: Import Organization

**File:** `.lefthook.yml`

**Insert after type-check (~line 85):**

```yaml
# Organize imports
organize-imports:
  priority: 1
  glob: '*.{ts,tsx,js,jsx}'
  run: |
    if command -v organize-imports-cli >/dev/null 2>&1; then
      echo "📋 Organizing imports..."
      organize-imports-cli {staged_files}
    fi
  stage_fixed: true
```

**Rationale:**

- Optional enhancement (doesn't fail if missing)
- Auto-stages organized imports
- Improves code consistency

---

## Phase 3: Governance Layer

**Priority:** 2 (Medium - Blocking on violations)  
**Execution:** Parallel advisory checks

### Implementation Steps

#### Step 3.1: Accessibility Linting

**File:** `.lefthook.yml`

**Insert after organize-imports (~line 95):**

```yaml
# Accessibility validation (WCAG 2.2 AA)
a11y-lint:
  priority: 2
  glob: '*.{tsx,jsx}'
  run: |
    echo "♿ Checking accessibility compliance..."
    npx eslint --plugin jsx-a11y \
      --rule 'jsx-a11y/alt-text: error' \
      --rule 'jsx-a11y/aria-props: error' \
      --rule 'jsx-a11y/aria-role: error' \
      --rule 'jsx-a11y/role-has-required-aria-props: error' \
      --rule 'jsx-a11y/role-supports-aria-props: error' \
      {staged_files} || {
      echo ""
      echo "❌ Accessibility violations detected"
      echo "See: docs/05-engineering-and-devops/ui/ux-accessibility.md"
      echo "WCAG 2.2 AA compliance is mandatory"
      exit 1
    }
```

**Rationale:**

- WCAG 2.2 AA is constitutionally mandated
- Specific a11y rules enforced
- Links to project documentation

#### Step 3.2: Political Neutrality Check

**File:** `.lefthook.yml`

**Current code (lines ~118-123):**

```yaml
# AI-powered validations
ai-neutrality-check:
  glob: '*.{ts,tsx,js,jsx,md}'
  run: |
    if [ -f tools/scripts/ai/precommit-neutrality.mts ]; then
      node tools/scripts/ai/precommit-neutrality.mts {staged_files} || echo "⚠️ AI neutrality check completed with warnings"
    fi
```

**Replace with:**

```yaml
# Political neutrality validation (CONSTITUTIONAL)
neutrality-check:
  priority: 2
  glob: '*.{ts,tsx,js,jsx,md,json}'
  run: |
    if [ -f tools/scripts/ai/precommit-neutrality.mts ]; then
      echo "🤝 Checking political neutrality..."
      node --loader ts-node/esm \
        tools/scripts/ai/precommit-neutrality.mts {staged_files} || {
        echo ""
        echo "❌ BLOCKING: Political neutrality violation detected"
        echo "Review changes for bias or political manipulation"
        echo "See: docs/02-governance/ai-ethics.md"
        echo "This is a constitutional requirement"
        exit 1
      }
    else
      echo "⚠️  Neutrality check script not found (non-blocking)"
    fi
```

**Rationale:**

- Elevate to blocking (constitutional requirement)
- Add ts-node loader for .mts files
- Clear constitutional context
- Graceful degradation if script missing

#### Step 3.3: Test Quality Gates

**File:** `.lefthook.yml`

**Current code (lines ~72-78):**

```yaml
# No .only() in tests
no-only-tests:
  glob: '*.{test,spec}.{ts,tsx}'
  run: |
    if grep -nE "(describe|it|test)\\.only" {staged_files} 2>/dev/null; then
      echo "❌ .only() found in tests"
      exit 1
    fi
```

**Replace with:**

```yaml
# Test quality gates
test-quality:
  priority: 2
  glob: '*.{test,spec}.{ts,tsx,js,jsx}'
  run: |
    echo "🧪 Validating test quality..."

    # Check for .only()
    if grep -rn "\\<only\\>(" {staged_files} 2>/dev/null; then
      echo "❌ .only() detected in tests"
      echo "Remove .only() before committing"
      exit 1
    fi

    # Ensure test files have test cases
    for file in {staged_files}; do
      if ! grep -q "describe\\|it\\|test" "$file" 2>/dev/null; then
        echo "⚠️  Test file without test cases: $file"
      fi
    done

    # Check for commented-out tests (advisory)
    if grep -rn "// *\\(it\\|test\\|describe\\)" {staged_files} 2>/dev/null; then
      echo "⚠️  Commented-out tests detected (review needed)"
    fi
```

**Rationale:**

- Comprehensive test validation
- Multiple quality checks
- Advisory warnings for suspicious patterns

#### Step 3.4: Documentation Completeness

**File:** `.lefthook.yml`

**Insert after test-quality (~line 115):**

```yaml
# Documentation completeness (advisory)
docs-check:
  priority: 2
  glob: '*.{ts,tsx}'
  run: |
    echo "📚 Checking documentation..."

    # Check for JSDoc on exported functions
    for file in {staged_files}; do
      if grep -l "^export " "$file" 2>/dev/null | xargs grep -L "/\\*\\*" 2>/dev/null; then
        echo "⚠️  Exported functions missing JSDoc in: $file"
      fi
    done || true
```

**Rationale:**

- Advisory only (doesn't block)
- Encourages documentation
- Checks exported APIs

---

## Phase 4: Infrastructure Validation

**Priority:** 3 (Low - Conditional)  
**Execution:** Parallel, only when relevant files change

### Implementation Steps

#### Step 4.1: GitHub Actions Validation

**File:** `.lefthook.yml`

**Current code (lines ~97-103):**

```yaml
# GitHub workflows
actionlint:
  glob: '.github/workflows/*.{yml,yaml}'
  run: |
    if command -v actionlint >/dev/null 2>&1; then
      actionlint {staged_files}
    fi
```

**Replace with:**

```yaml
# GitHub Actions validation
actionlint:
  priority: 3
  glob: '.github/workflows/*.{yml,yaml}'
  run: |
    if command -v actionlint >/dev/null 2>&1; then
      echo "⚙️  Validating GitHub Actions..."
      actionlint {staged_files} || {
        echo ""
        echo "❌ GitHub Actions validation failed"
        echo "Fix workflow syntax errors"
        echo "Install: brew install actionlint"
        exit 1
      }
    else
      echo "⚠️  actionlint not installed (brew install actionlint)"
    fi
```

**Rationale:**

- Better error messaging
- Installation hints
- Conditional execution only on workflow files

#### Step 4.2: Docker Linting

**File:** `.lefthook.yml`

**Current code (lines ~105-111):**

```yaml
# Docker linting
hadolint:
  glob: '**/Dockerfile*'
  run: |
    if command -v hadolint >/dev/null 2>&1; then
      hadolint {staged_files}
    fi
```

**Replace with:**

```yaml
# Docker linting
hadolint:
  priority: 3
  glob: '{**/Dockerfile*,**/*.dockerfile}'
  run: |
    if command -v hadolint >/dev/null 2>&1; then
      echo "🐳 Linting Dockerfiles..."
      hadolint --ignore DL3008 --ignore DL3009 {staged_files} || {
        echo ""
        echo "❌ Dockerfile linting failed"
        echo "Fix Dockerfile issues"
        echo "Install: brew install hadolint"
        exit 1
      }
    else
      echo "⚠️  hadolint not installed (brew install hadolint)"
    fi
```

**Rationale:**

- Ignore common false positives (DL3008, DL3009)
- Support .dockerfile extension
- Better error messages

#### Step 4.3: Kubernetes Manifest Validation

**File:** `.lefthook.yml`

**Insert after hadolint (~line 130):**

```yaml
# Kubernetes manifest validation
kubeval:
  priority: 3
  glob: '{**/k8s/**/*.yml,**/k8s/**/*.yaml,**/kubernetes/**/*.yml,**/kubernetes/**/*.yaml}'
  run: |
    if command -v kubeval >/dev/null 2>&1; then
      echo "☸️  Validating Kubernetes manifests..."
      kubeval --strict {staged_files} || {
        echo ""
        echo "❌ Kubernetes manifest validation failed"
        echo "Fix manifest syntax errors"
        echo "Install: brew install kubeval"
        exit 1
      }
    fi
```

**Rationale:**

- Only runs on K8s manifest files
- Strict validation
- Optional (doesn't block if not installed)

#### Step 4.4: Terraform Validation

**File:** `.lefthook.yml`

**Insert after kubeval (~line 145):**

```yaml
# Terraform validation
tflint:
  priority: 3
  glob: '**/*.tf'
  run: |
    if command -v tflint >/dev/null 2>&1; then
      echo "🏗️  Validating Terraform files..."
      for file in {staged_files}; do
        dir=$(dirname "$file")
        (cd "$dir" && tflint) || {
          echo "❌ Terraform validation failed in $dir"
          exit 1
        }
      done
    fi
```

**Rationale:**

- Validates per directory (Terraform context)
- Optional infrastructure validation
- Only runs on .tf files

---

## Phase 5: Commit Message Hooks

**Priority:** N/A (commit-msg stage)  
**Execution:** Sequential validation

### Implementation Steps

#### Step 5.1: Enhanced Conventional Commits with Empty Message Check

**File:** `.lefthook.yml`

**Current code (lines ~160-168):**

```yaml
commit-msg:
  commands:
    conventional:
      run: |
        msg=$(cat {1})
        if ! echo "$msg" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,}"; then
          echo "❌ Use Conventional Commits: type(scope): message"
          exit 1
        fi
```

**Replace with:**

```yaml
commit-msg:
  commands:
    conventional-commits:
      run: |
        MSG=$(cat {1})

        # Check for empty or whitespace-only message
        if [ -z "$MSG" ] || ! echo "$MSG" | grep -q '[^[:space:]]'; then
          echo "❌ Empty commit message"
          echo ""
          echo "Commit messages are required and must not be empty"
          echo "Use Conventional Commits format:"
          echo "  feat(scope): add new feature"
          echo "  fix(scope): bug fix"
          echo "  docs: update documentation"
          exit 1
        fi

        # Check for minimum message length
        MSG_NO_WHITESPACE=$(echo "$MSG" | tr -d '[:space:]')
        if [ ${#MSG_NO_WHITESPACE} -lt 10 ]; then
          echo "❌ Commit message too short"
          echo ""
          echo "Minimum 10 characters required (excluding whitespace)"
          echo "Your message has ${#MSG_NO_WHITESPACE} characters"
          echo ""
          echo "Provide a descriptive commit message explaining the change"
          exit 1
        fi

        # Conventional Commits validation
        if ! echo "$MSG" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,}"; then
          echo "❌ Invalid commit message format"
          echo ""
          echo "Use Conventional Commits:"
          echo "  feat(scope): add new feature"
          echo "  fix(scope): bug fix"
          echo "  docs: update documentation"
          echo ""
          echo "Types: feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert"
          echo ""
          echo "Your message:"
          echo "  $MSG"
          exit 1
        fi

        # Check message length
        TITLE=$(echo "$MSG" | head -n 1)
        if [ ${#TITLE} -gt 100 ]; then
          echo "❌ Commit title too long (${#TITLE} > 100 characters)"
          echo "Keep title under 100 characters"
          exit 1
        fi

        # Block WIP commits on main branch
        BRANCH=$(git branch --show-current)
        if [[ "$BRANCH" == "main" ]] && echo "$MSG" | grep -iqE "^(wip|WIP|fixup|squash)"; then
          echo "❌ WIP commits not allowed on main branch"
          echo "Finish your work before committing to main"
          echo "Or use a feature branch: git checkout -b feature/your-feature"
          exit 1
        fi

        # Check for required issue reference (advisory)
        if ! echo "$MSG" | grep -qE "#[0-9]+|Closes #[0-9]+|Fixes #[0-9]+"; then
          echo "⚠️  Consider referencing an issue: #123 or Closes #123"
        fi
```

**Rationale:**

- **Empty message detection** - Blocks commits with no message or whitespace-only
- **Minimum length check** - Ensures meaningful commit messages (10+ characters)
- Comprehensive commit message validation
- Clear examples and error messages
- Length checking (max 100 characters)
- Branch protection (no WIP on main)
- Issue reference encouragement

---

## Phase 6: Pre-Push Hooks

**Priority:** N/A (pre-push stage)  
**Execution:** Sequential (expensive operations)

### Implementation Steps

#### Step 6.1: Full Type Check

**File:** `.lefthook.yml`

**Current code (lines ~148-151):**

```yaml
pre-push:
  commands:
    audit:
      run: npm run audit || true

    full-type-check:
      run: npx tsc --noEmit
```

**Replace with:**

```yaml
pre-push:
  parallel: false # Sequential for pre-push (expensive operations)

  commands:
    # Full type check
    full-type-check:
      run: |
        echo "🔍 Running full TypeScript type check..."
        npx tsc --noEmit || {
          echo ""
          echo "❌ TypeScript type errors found"
          echo "Fix all type errors before pushing"
          echo "Run: npx tsc --noEmit"
          exit 1
        }
```

**Rationale:**

- Comprehensive type checking before push
- Clear error messages
- Blocking on errors

#### Step 6.2: Test Changed Files

**File:** `.lefthook.yml`

**Current code (lines ~153-154):**

```yaml
tests:
  run: npm test
```

**Replace with:**

```yaml
# Run tests on changed files
test-changed:
  run: |
    echo "🧪 Running tests on changed files..."
    VITEST_CHANGED=1 npm run test:changed || {
      echo ""
      echo "❌ Tests failed"
      echo "Fix failing tests before pushing"
      echo "Run: npm run test:changed"
      exit 1
    }
```

**Rationale:**

- Only test changed files (faster)
- Environment variable for test runner
- Clear failure messages

#### Step 6.3: Security Audit

**File:** `.lefthook.yml`

**Insert after test-changed (~line 170):**

```yaml
# Dependency security audit
audit:
  run: |
    echo "🔒 Running security audit..."
    npm audit --audit-level=moderate || {
      echo ""
      echo "⚠️  Security vulnerabilities found"
      echo "Review: npm audit"
      echo "Fix: npm audit fix"
      echo "Note: This is a warning - push will proceed"
    }
```

**Rationale:**

- Advisory only (doesn't block push)
- Moderate level (high/critical in pre-commit)
- Informational for security awareness

#### Step 6.4: Update AI Index

**File:** `.lefthook.yml`

**Current code (lines ~143-148):**

```yaml
# Update AI index before push
update-ai-index:
  run: |
    if [ -f tools/scripts/ai/update-recent-changes.js ]; then
      echo "📝 Updating AI index with recent changes..."
      node tools/scripts/ai/update-recent-changes.js || echo "⚠️ AI index update failed (non-blocking)"
    fi
```

**Keep as-is but add better messaging:**

```yaml
# Update AI index
ai-index:
  run: |
    if [ -f tools/scripts/ai/update-recent-changes.js ]; then
      echo "📝 Updating AI index..."
      node tools/scripts/ai/update-recent-changes.js || {
        echo "⚠️  AI index update failed (non-blocking)"
        echo "This won't prevent pushing"
      }
    fi
```

**Rationale:**

- Non-blocking (informational)
- Updates AI context before sharing code
- Graceful failure

#### Step 6.5: Branch Protection Check

**File:** `.lefthook.yml`

**Insert after ai-index (~line 185):**

```yaml
# Branch protection awareness
branch-protection:
  run: |
    BRANCH=$(git branch --show-current)
    REMOTE_BRANCH=$(git rev-parse --abbrev-ref @{upstream} 2>/dev/null)

    if [[ "$BRANCH" == "main" ]]; then
      echo "⚠️  You are pushing directly to main"
      echo "Consider using a feature branch:"
      echo "  git checkout -b feature/your-feature"
      echo ""
      echo "Press Ctrl+C to cancel or wait 3 seconds to continue..."
      sleep 3
    fi
```

**Rationale:**

- Awareness, not blocking
- Encourages feature branches
- 3-second pause for reconsideration

---

## Phase 7: Performance Optimization

**Priority:** N/A (Configuration enhancements)  
**Execution:** N/A

### Implementation Steps

#### Step 7.1: Add Global Performance Settings

**File:** `.lefthook.yml`

**Insert at top of file (after version comment):**

```yaml
# =============================================================================
# Lefthook Configuration - Political Sphere Pre-Commit Hooks
# Version: 3.0.0 (Enhanced Industry-Standard Implementation)
# Last Updated: 2025-11-17
# =============================================================================
#
# Performance optimizations and fail-fast security checks
# Install: npm install -g lefthook && lefthook install
# Skip: LEFTHOOK=0 git commit (emergencies only)
# Exclude: LEFTHOOK_EXCLUDE=hook_name git commit
#
# =============================================================================

min_version: 1.5.0

# Skip output for passed hooks (reduces noise)
skip_output:
  - meta
  - summary

# Fail fast on first error (performance)
piped: true
```

**Rationale:**

- Minimum version enforcement
- Reduced output noise
- Fail-fast behavior

#### Step 7.2: Add Execution Environment Variables

**File:** `.lefthook.yml`

**Insert before pre-commit section:**

```yaml
# Global settings
pre-commit:
  parallel: true

  # Global environment
  settings:
    # Fail fast on critical errors
    fail_fast: true

    # Skip output for passed hooks
    skip_output:
      - meta
      - execution

  # Environment variables
  env:
    # Enable incremental checks
    INCREMENTAL: 'true'

    # Fast mode for development (override in CI)
    FAST_MODE: '{env:FAST_MODE}'
```

**Rationale:**

- Centralized settings
- Environment-based configuration
- CI/local differentiation

---

## Phase 8: Documentation and Training

**Priority:** N/A (Post-implementation)  
**Execution:** N/A

### Implementation Steps

#### Step 8.1: Create Developer Onboarding Guide

**File:** `docs/05-engineering-and-devops/development/git-hooks-onboarding.md`

**Content:**

````markdown
# Git Hooks Onboarding Guide

## Quick Start

### Installation

```bash
# Install Lefthook globally
npm install -g lefthook

# Install hooks in this repository
lefthook install

# Verify installation
lefthook run pre-commit --help
```
````

### Common Commands

```bash
# Run pre-commit hooks manually
lefthook run pre-commit

# Run specific hook
lefthook run pre-commit --commands gitleaks

# Skip hooks (emergencies only)
LEFTHOOK=0 git commit -m "emergency fix"

# Skip specific hook
LEFTHOOK_EXCLUDE=gitleaks git commit -m "docs: update README"
```

### Troubleshooting

**Problem:** Hooks not running

```bash
# Reinstall hooks
lefthook uninstall
lefthook install
```

**Problem:** False positive from security scan

```bash
# Add to .gitleaks.toml allowlist (with justification)
# Then commit the change
```

See: [Pre-Commit Hooks Implementation Guide](./pre-commit-hooks-implementation-guide.md)

````

#### Step 8.2: Update ADR

**File:** `docs/04-architecture/adr/ADR-XXX-pre-commit-hooks-strategy.md`

**Content:**
```markdown
# ADR XXX: Pre-Commit Hook Strategy

**Status:** ACCEPTED
**Date:** 2025-11-17
**Deciders:** Development Team

## Context

We need a consistent, performant, and secure pre-commit hook strategy that:
- Enforces security standards (zero-trust, secrets scanning)
- Validates code quality (linting, formatting, type checking)
- Ensures accessibility compliance (WCAG 2.2 AA)
- Maintains political neutrality (constitutional requirement)
- Provides fast feedback to developers

## Decision

Implement industry-standard pre-commit hooks using Lefthook with:

1. **Priority-based execution** (0=critical, 1=quality, 2=governance, 3=infrastructure)
2. **Parallel execution** for independent checks
3. **Auto-fix with staging** for formatting and linting
4. **Clear error messages** with remediation steps
5. **CI/CD parity** (hooks match CI checks)

## Consequences

**Positive:**
- Faster feedback loop (catch issues before CI)
- Reduced CI costs (fewer failed builds)
- Consistent code quality
- Enhanced security posture
- Better developer experience

**Negative:**
- Initial setup time
- Learning curve for team
- Potential commit slowdown (mitigated by parallelization)

**Neutral:**
- Requires tool installation (gitleaks, actionlint, etc.)
- Periodic maintenance needed

## References

- [Pre-Commit Hooks Implementation Guide](../05-engineering-and-devops/development/pre-commit-hooks-implementation-guide.md)
- [Lefthook Documentation](https://github.com/evilmartians/lefthook)
- [pre-commit.com Best Practices](https://pre-commit.com/)
````

#### Step 8.3: Update TODO.md

**File:** `docs/TODO.md`

**Add section:**

```markdown
## Pre-Commit Hooks Enhancement

- [/] Implement enhanced security layer (gitleaks, dependency scanning, license check)
- [ ] Implement code quality layer (Biome integration, TypeScript, import organization)
- [ ] Implement governance layer (accessibility, neutrality, test quality)
- [ ] Implement infrastructure validation (actionlint, hadolint, kubeval)
- [ ] Enhance commit message validation
- [ ] Enhance pre-push hooks
- [ ] Add performance optimizations
- [ ] Create developer documentation
- [ ] Team training session
- [ ] Monitor performance metrics
```

#### Step 8.4: Update CHANGELOG.md

**File:** `CHANGELOG.md`

**Add entry:**

```markdown
## [Unreleased]

### Added

- Enhanced pre-commit hook system with industry-standard practices
  - Priority-based execution (fail-fast on critical errors)
  - Dependency vulnerability scanning
  - License compliance checking
  - Accessibility linting (WCAG 2.2 AA)
  - Enhanced political neutrality checks
  - Comprehensive commit message validation
  - Infrastructure validation (GitHub Actions, Docker, Kubernetes, Terraform)
  - Performance optimizations (parallel execution, caching)

### Changed

- Upgraded Lefthook configuration to v3.0.0
- Gitleaks now fails explicitly on secret detection
- TypeScript type checking uses incremental compilation
- Commit messages now validated for length and WIP status

### Improved

- Error messages with clear remediation steps
- Developer experience with auto-fix and staging
- CI/CD parity (hooks match CI checks)
```

---

## Validation and Testing

### Pre-Release Testing

#### Test 1: Security Layer

```bash
# Test gitleaks
echo "secret_key=abc123def456" > test-secret.txt
git add test-secret.txt
git commit -m "test: trigger gitleaks"
# Expected: BLOCKED with gitleaks error

# Cleanup
git reset HEAD test-secret.txt
rm test-secret.txt
```

#### Test 2: Code Quality

```bash
# Test formatting
echo "const x=1;const y=2;" > test-format.js
git add test-format.js
git commit -m "test: auto-fix formatting"
# Expected: Auto-fixed and staged

# Cleanup
git reset HEAD test-format.js
rm test-format.js
```

#### Test 3: Governance

```bash
# Test accessibility (create invalid JSX)
echo "export const Img = () => <img src='test.jpg' />" > test-a11y.tsx
git add test-a11y.tsx
git commit -m "test: trigger a11y check"
# Expected: BLOCKED (missing alt text)

# Cleanup
git reset HEAD test-a11y.tsx
rm test-a11y.tsx
```

#### Test 4: Commit Message

```bash
# Test empty commit message
git commit --allow-empty -m ""
# Expected: BLOCKED (empty message)

# Test too-short commit message
git commit --allow-empty -m "fix"
# Expected: BLOCKED (too short, minimum 10 characters)

# Test invalid commit message
git commit --allow-empty -m "invalid message"
# Expected: BLOCKED (not conventional commits)

# Test valid commit message
git commit --allow-empty -m "test: validate commit message format"
# Expected: SUCCESS
```

#### Test 5: Performance

```bash
# Measure hook execution time
time lefthook run pre-commit
# Expected: < 15 seconds for typical changes
```

### Post-Release Monitoring

#### Metrics to Track

1. **Hook execution time** (target: < 15s for pre-commit)
2. **False positive rate** (target: < 5%)
3. **Developer feedback** (satisfaction survey)
4. **CI failure rate** (should decrease)
5. **Security incident rate** (should decrease)

#### Monitoring Commands

```bash
# Check hook performance
lefthook run pre-commit --verbose

# Review gitleaks logs
cat .git/hooks/pre-commit.log

# Test all hooks without committing
lefthook run pre-commit --all-files
```

---

## Rollback Plan

### Immediate Rollback (< 1 hour)

If critical issues arise:

```bash
# 1. Restore backup
cp .lefthook.yml.backup .lefthook.yml

# 2. Reinstall hooks
lefthook uninstall
lefthook install

# 3. Verify
git commit --allow-empty -m "test: verify rollback"
```

### Partial Rollback (Disable specific hooks)

```bash
# Disable problematic hook via environment variable
LEFTHOOK_EXCLUDE=problematic-hook git commit -m "..."

# Or edit .lefthook.yml to skip the hook:
# skip: true
```

### Backup Strategy

**Before implementation:**

```bash
# Backup current configuration
cp .lefthook.yml .lefthook.yml.backup.$(date +%Y%m%d)

# Backup git hooks directory
cp -r .git/hooks .git/hooks.backup.$(date +%Y%m%d)
```

---

## Success Criteria

### Implementation Complete When:

- [ ] All phases implemented and tested
- [ ] Documentation complete and reviewed
- [ ] Team training conducted
- [ ] Metrics baseline established
- [ ] Rollback plan verified
- [ ] ADR approved and merged
- [ ] CHANGELOG updated
- [ ] TODO.md updated

### Performance Targets:

- ✅ Pre-commit hooks execute in < 15 seconds (average)
- ✅ False positive rate < 5%
- ✅ Zero secrets committed (gitleaks catch rate: 100%)
- ✅ Developer satisfaction score > 4/5
- ✅ CI failure rate reduced by 30%+

### Quality Targets:

- ✅ 100% WCAG 2.2 AA compliance on UI changes
- ✅ Zero political bias detected in commits
- ✅ All dependencies scanned for vulnerabilities
- ✅ Infrastructure-as-code validated before commit

---

## Appendix A: Tool Installation Reference

### macOS (Homebrew)

```bash
# Security
brew install gitleaks

# Infrastructure validation
brew install actionlint hadolint yamllint

# Optional tools
brew install jq               # JSON validation
brew install kubeval          # Kubernetes manifests
brew install tflint           # Terraform
```

### Linux (Ubuntu/Debian)

```bash
# Security
curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_amd64.tar.gz | tar -xzv
sudo mv gitleaks /usr/local/bin/

# Infrastructure validation
sudo apt-get install yamllint
```

### Node.js Packages

```bash
# Global installations
npm install -g lefthook
npm install -g @biomejs/biome
npm install -g license-checker
npm install -g organize-imports-cli
```

---

## Appendix B: Quick Reference Commands

### Daily Usage

```bash
# Normal commit (hooks run automatically)
git commit -m "feat: add new feature"

# Skip all hooks (emergency only)
LEFTHOOK=0 git commit -m "emergency: fix production"

# Skip specific hook
LEFTHOOK_EXCLUDE=gitleaks git commit -m "docs: update"

# Run hooks manually
lefthook run pre-commit

# Run specific hook
lefthook run pre-commit --commands gitleaks
```

### Maintenance

```bash
# Update hooks
lefthook install

# Uninstall hooks
lefthook uninstall

# Dump current configuration
lefthook dump

# Verify installation
lefthook version
```

### Debugging

```bash
# Verbose output
lefthook run pre-commit --verbose

# Force run without staged files
lefthook run pre-commit --all-files

# Check configuration
lefthook dump
```

---

## Appendix C: CI/CD Integration

### GitHub Actions Example

```yaml
name: Pre-commit Checks

on: [pull_request]

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Lefthook
        run: npm install -g lefthook

      - name: Install dependencies
        run: npm ci

      - name: Run pre-commit hooks
        run: lefthook run pre-commit --all-files
        env:
          FAST_MODE: 'false' # Full validation in CI
```

---

## Implementation Notes

**Estimated Time:** 4-6 hours  
**Risk Level:** Low (gradual rollout possible)  
**Dependencies:** Lefthook already installed  
**Breaking Changes:** None (additive enhancements)

**Recommended Rollout:**

1. **Week 1:** Implement Phases 1-2 (Security + Quality)
2. **Week 2:** Implement Phases 3-4 (Governance + Infrastructure)
3. **Week 3:** Implement Phases 5-6 (Messages + Pre-push)
4. **Week 4:** Optimize and document (Phases 7-8)

**Team Communication:**

- Announce changes in team meeting
- Share onboarding guide
- Schedule Q&A session
- Monitor feedback for 2 weeks

---

**END OF IMPLEMENTATION GUIDE**
