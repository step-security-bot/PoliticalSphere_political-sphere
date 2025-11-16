# Apps Directory README

## 1. Directory Identity & Purpose

**Directory Name:** apps

**Short Description:** This directory contains the main application services for the Political Sphere platform, housing deployable applications and services in a microservices architecture.

**Role within the System:** Provides the core executable components of the platform, including backend APIs, frontend interfaces, workers, and infrastructure services. It enables the deployment and operation of the political simulation game.

**Unique Value:** Centralizes all runtime applications, ensuring modularity, scalability, and independent deployment of services.

**Intended Audience:** Developers (for coding and maintenance), DevOps (for deployment), governance auditors (for compliance), AI personas (for code generation and review).

**Classification/Category:** Core system (within central TODO list).

## 2. Scope, Boundaries, & Responsibilities

**Responsibilities:** Manages all deployable applications, including API services, web frontends, background workers, and infrastructure tools. Handles business logic, user interactions, data processing, and system integrations.

**Not Responsible For:** Shared libraries (in libs/), documentation (in docs/), configuration (in config/), assets (in assets/), or data (in data/).

**Functional Scope:** Microservices architecture with independent services communicating via APIs. Expected behavior: services start, scale, and communicate reliably.

**Architectural Domain:** Application layer in the system architecture.

**Key Files and Subdirectories:**

- `api/`: Backend API service
- `web/`: Main web application (React)
- `worker/`: Background job processing
- `game-server/`: Real-time simulation engine
- `shell/`: Module federation host
- `feature-auth-remote/`: Authentication microfrontend
- `feature-dashboard-remote/`: Dashboard microfrontend
- `infrastructure/`: IaC and deployments
- `load-test/`: Performance testing
- `e2e/`: End-to-end testing
- `dev/`: Development tools

**Maturity Level:** Stable

**Current Limitations:** Some services may have prototype features.

**Known Issues:** None major.

## 3. Criticality, Risk Profile, & Access Level

**Criticality:** High (core to platform operation)

**Risk Level:** Medium (deployment issues could affect availability)

**Volatility:** Stable (changes are controlled)

**Required Skill Levels:** Intermediate to expert (TypeScript, React, Node.js)

**Required AI Personas:** CTO-level engineering partner, security-focused

**Access/Permission Restrictions:** Standard development access; changes to infrastructure require DevOps review.

**Sensitive Areas:** Authentication services (security review required), brittle code in legacy parts.

## 4. Dependencies, Interfaces, & Integration Contracts

**Internal Dependencies:** Depends on libs/ for shared code, config/ for configurations.

**External Dependencies:** Node.js, Docker, Kubernetes.

**Upstream:** Receives data from libs/, config/

**Downstream:** Provides APIs to web/, worker/

**Integration Expectations:** Services communicate via REST/GraphQL APIs, module federation for frontends.

**Public Interfaces:** API endpoints, module exports.

**Contracts:** API schemas in openapi/, GraphQL schemas.

**Data Flows:** User requests → API → libs → database

**Assumptions:** Microservices are independent, no circular deps.

**Volatile Dependencies:** Some libs may change.

## 5. Operational Standards, Practices, & Tooling

**Languages:** TypeScript, JavaScript

**Conventions:** ESLint, Prettier, strict typing, camelCase.

**Operational Rules:** Test-first, CI/CD with Nx, Vitest for testing.

**Tooling:** Node, Nx, Docker, Vitest, Playwright.

**Code Quality:** 80% coverage, WCAG AA, security scans.

**Tests:** Unit, integration, E2E.

**Logging:** Structured JSON logs.

**Error Handling:** Comprehensive, with retries.

**Performance:** p95 <200ms for APIs.

**Patterns:** No direct DB access, use libs.

**References:** docs/05-engineering-and-devops/, ADRs in docs/architecture/adr/

## 6. Future Direction, Roadmap, & Definition of Done

**Long-term Purpose:** Evolve to support more complex simulations, new features.

**Roadmap:** Add AI-driven services, refactor to serverless.

**Definition of Done:** All services have 80% test coverage, WCAG AA, deployed successfully.

**Missing Components:** Some e2e tests.

**Upcoming Integrations:** New AI features.

**Test Coverage Goals:** 90%

**Automation Needs:** More CI/CD.

**Upstream Work:** Update libs.

**Risks/Blockers:** Resource constraints.

## 7. Assumptions, Constraints, & Architectural Guarantees

**Assumptions:** Microservices architecture, Kubernetes deployment, TypeScript strict.

**Constraints:** No circular dependencies, use Nx for builds.

**Guarantees:** Independent deployment, scalable.

**Forbidden Patterns:** Direct DB access from apps.

## 8. Common Pitfalls, Anti-Patterns, & Lessons Learned

**Pitfalls:** Circular dependencies, missing tests.

**Anti-Patterns:** Monolithic code in services.

**Misunderstandings:** Assuming shared state.

**Failure Modes:** Performance bottlenecks in API.

**Warnings:** Security in auth services.

**Best Practices:** Use libs for shared code, test thoroughly.

## 9. Maintenance, Ownership, & Review Cycle

**Ownership:** Development team, AI partners.

**Review Processes:** Code review, security for auth.

**Review Cadence:** On major changes, quarterly.

**Refactoring:** Safe with tests.

**Escalation:** To CTO for critical issues.
