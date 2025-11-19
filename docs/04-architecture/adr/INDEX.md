# Architecture Decision Records (ADR) Index

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Last Updated**: 2025-11-10  
**Total ADRs**: 13

This document provides a comprehensive index of all architectural decisions made in the Political Sphere project.

## Status Summary

- ✅ **Accepted**: 11
- ❓ **Unknown**: 2 (pending status update)

## Quick Reference

- [ADR Template](0001-adr-template.md) - Use this template for new ADRs

## All ADRs

| #    | Title                                                                  | Status      | Date       | Tags                                |
| ---- | ---------------------------------------------------------------------- | ----------- | ---------- | ----------------------------------- |
| 0001 | [ADR Template](0001-adr-template.md)                                   | Template    | 2025-11-10 | template, process                   |
| 0002 | [Monorepo Architecture with Nx](0002-monorepo-architecture.md)         | ✅ Accepted | 2025-11-10 | architecture, tooling, nx           |
| 0003 | [TypeScript with Strict Mode](0003-typescript-strict-mode.md)          | ✅ Accepted | 2025-11-10 | language, type-safety, quality      |
| 0004 | [Vitest as Primary Test Runner](0004-vitest-test-runner.md)            | ✅ Accepted | 2025-11-10 | testing, quality, tooling           |
| 0005 | [React 18+ for Frontend](0005-react-frontend.md)                       | ✅ Accepted | 2025-11-10 | frontend, ui, accessibility         |
| 0006 | [GitHub Actions as CI Platform](0006-github-actions-ci-platform.md)    | ✅ Accepted | -          | ci-cd, automation                   |
| 0007 | [Lefthook for Git Hooks](0007-lefthook-git-hooks.md)                   | ✅ Accepted | -          | tooling, git, pre-commit            |
| 0008 | [Multi-Layer Security Scanning](0008-multi-layer-security-scanning.md) | ✅ Accepted | -          | security, scanning, SAST            |
| 0009 | [Canary Deployment Strategy](0009-canary-deployment-strategy.md)       | ✅ Accepted | -          | deployment, kubernetes, progressive |
| 0010 | [Zero-Trust Security Architecture](0010-zero-trust-security.md)        | ✅ Accepted | 2025-11-10 | security, architecture, compliance  |
| 0015 | [Deployment Strategies for Kubernetes](0015-deployment-strategies.md)  | ❓ Unknown  | Unknown    | deployment, kubernetes              |
| 0016 | [Test Coverage Strategy](0016-test-coverage-strategy.md)               | ✅ Accepted | -          | testing, quality, coverage          |
| 0017 | [Frontend E2E Server](0017-frontend-e2e-server.md)                     | ✅ Accepted | -          | testing, e2e, frontend              |

## By Status

### ✅ Accepted (11)

- [0002 - Monorepo Architecture with Nx](0002-monorepo-architecture.md)
- [0003 - TypeScript with Strict Mode](0003-typescript-strict-mode.md)
- [0004 - Vitest as Primary Test Runner](0004-vitest-test-runner.md)
- [0005 - React 18+ for Frontend](0005-react-frontend.md)
- [0006 - GitHub Actions as CI Platform](0006-github-actions-ci-platform.md)
- [0007 - Lefthook for Git Hooks](0007-lefthook-git-hooks.md)
- [0008 - Multi-Layer Security Scanning](0008-multi-layer-security-scanning.md)
- [0009 - Canary Deployment Strategy](0009-canary-deployment-strategy.md)
- [0010 - Zero-Trust Security Architecture](0010-zero-trust-security.md)
- [0016 - Test Coverage Strategy](0016-test-coverage-strategy.md)
- [0017 - Frontend E2E Server](0017-frontend-e2e-server.md)

### ❓ Unknown (2)

- [0015 - Deployment Strategies](0015-deployment-strategies.md)

## By Category

### Architecture & Infrastructure

- [0002 - Monorepo Architecture with Nx](0002-monorepo-architecture.md)
- [0010 - Zero-Trust Security Architecture](0010-zero-trust-security.md)
- [0015 - Deployment Strategies](0015-deployment-strategies.md)

### Development & Tooling

- [0003 - TypeScript with Strict Mode](0003-typescript-strict-mode.md)
- [0004 - Vitest as Primary Test Runner](0004-vitest-test-runner.md)
- [0007 - Lefthook for Git Hooks](0007-lefthook-git-hooks.md)

### Frontend

- [0005 - React 18+ for Frontend](0005-react-frontend.md)
- [0017 - Frontend E2E Server](0017-frontend-e2e-server.md)

### CI/CD & Deployment

- [0006 - GitHub Actions as CI Platform](0006-github-actions-ci-platform.md)
- [0009 - Canary Deployment Strategy](0009-canary-deployment-strategy.md)

### Security

- [0008 - Multi-Layer Security Scanning](0008-multi-layer-security-scanning.md)
- [0010 - Zero-Trust Security Architecture](0010-zero-trust-security.md)

### Testing & Quality

- [0004 - Vitest as Primary Test Runner](0004-vitest-test-runner.md)
- [0016 - Test Coverage Strategy](0016-test-coverage-strategy.md)
- [0017 - Frontend E2E Server](0017-frontend-e2e-server.md)

## Pending ADRs (Recommended)

The following architectural decisions should be documented:

- **Database Selection** - PostgreSQL vs alternatives, schema design
- **API Design** - REST vs GraphQL, versioning strategy
- **Authentication** - JWT implementation, OAuth providers
- **State Management** - Frontend state strategy (Context, Redux, Zustand)
- **Deployment Platform** - AWS, GCP, Azure, or hybrid
- **Monitoring & Observability** - OpenTelemetry, logging strategy
- **Microservices vs Monolith** - Service boundaries and communication
- **Caching Strategy** - Redis, CDN, application-level caching

## Related Documentation

- [Architecture Overview](/docs/04-architecture/architecture.md)
- [System Design](/docs/04-architecture/system-overview.md)
- [API Architecture](/docs/04-architecture/api-architecture/)
