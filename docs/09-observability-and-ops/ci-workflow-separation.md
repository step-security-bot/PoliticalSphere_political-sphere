# CI Workflow Separation of Concerns

**Date:** 2025-11-10  
**Status:** Documented  
**Reference:** Operation Clean-Up Item #6

## Overview

The repository uses multiple GitHub Actions workflows with clear separation of concerns. This document clarifies their distinct purposes to prevent redundancy.

## Primary Workflows

### 1. `ci.yml` - Main Continuous Integration Pipeline

**Purpose:** Comprehensive PR validation and main branch CI

**Triggers:**

- Push to `main` or `docs/observability-improvements`
- Pull requests to `main`
- Manual dispatch

**Stages:**

1. Preflight checks
2. Lint & type-check
3. Unit & integration tests
4. Security scanning (Gitleaks, Semgrep)
5. Integration tests
6. Deploy preview

**Characteristics:**

- Standalone workflow (not reusable)
- Full quality gate enforcement
- 95% success rate SLO
- <10min P95 duration target
- Uses Nx Cloud for caching

**Responsibilities:**

- Code quality validation
- Automated testing
- Security baseline
- PR gate keeper

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

### 2. `build-and-test.yml` - Reusable Build & Deployment Workflow

**Purpose:** Parameterized, reusable workflow for building Docker images and running Nx tasks

**Triggers:**

- `workflow_call` only (invoked by other workflows)

**Inputs:**

- Node.js version (default: 20)
- Services to build (Nx projects)
- Dockerfile path
- Image name
- Working directory
- Trivy scan toggle
- pnpm cache toggle

**Characteristics:**

- Reusable composite workflow
- Focused on build artifacts and container images
- Supports ECR deployment via OIDC
- Optional Trivy security scanning

**Responsibilities:**

- Docker image building
- Container registry push
- Nx project builds
- Artifact generation

---

## Key Differences

| Aspect            | ci.yml                     | build-and-test.yml         |
| ----------------- | -------------------------- | -------------------------- |
| **Type**          | Standalone                 | Reusable (`workflow_call`) |
| **Primary Goal**  | Quality gates              | Build artifacts            |
| **Testing Focus** | Unit + Integration + E2E   | Build validation           |
| **Security**      | Gitleaks + Semgrep + Trivy | Trivy (optional)           |
| **Deployment**    | Preview environments       | Container registry         |
| **Triggers**      | Push/PR events             | Called by other workflows  |
| **Scope**         | Full CI pipeline           | Focused build step         |

## Workflow Composition Pattern

`build-and-test.yml` is intended to be composed into other workflows when Docker image builds are needed:

```yaml
# Example: deployment workflow
jobs:
  build-api:
    uses: ./.github/workflows/build-and-test.yml
    with:
      services: 'api'
      image_name: 'political-sphere-api'
      enable_trivy: true
```

This enables:

- Consistent build patterns across workflows
- Centralized Docker build logic
- Reusable security scanning
- Parameterized service builds

## Recommendations

### ✅ Current Structure is Appropriate

The separation is intentional and follows GitHub Actions best practices:

1. **ci.yml**: Comprehensive PR validation (monolithic quality gate)
2. **build-and-test.yml**: Reusable build component (composable unit)

### No Merge Required

These workflows serve different purposes and should remain separate.

### Future Enhancements

1. Document `build-and-test.yml` usage examples in workflow README
2. Add workflow diagram showing composition relationships
3. Consider extracting security scanning into its own reusable workflow
4. Ensure `build-and-test.yml` is called by deployment workflows consistently

## Related Documentation

- ADR: `docs/adr/001-github-actions-as-ci-platform.md`
- Architecture: `docs/architecture/cicd-flow.md`
- Workflow metadata: See `@workflow-*` comments in each workflow file

---

**Conclusion:** No action required. Workflows have clear, distinct purposes aligned with GitHub Actions best practices for reusability and composition.
