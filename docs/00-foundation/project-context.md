# Project Context & Overview

**Version:** 1.0.0  
**Last Updated:** 2025-11-19  
**Status:** Living Document

## Executive Summary

Political Sphere is a UK-centric multiplayer political simulation platform that enables democratic governance through strategic gameplay. The project is built as an enterprise-grade Nx monorepo leveraging modern web technologies with a focus on security, accessibility, and democratic neutrality.

**Key Metrics:**

- **Codebase Size**: 12+ applications, 17+ libraries, 100+ documentation files
- **Test Coverage**: Target 80%+ for critical paths
- **Documentation**: 100+ structured documents across 12 sections
- **Development Model**: Solo developer + AI collaborative coding
- **Quality Standards**: WCAG 2.2 AA+, OWASP ASVS v5.0.0, zero-trust security

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Table of Contents

- [Project Identity](#project-identity)
- [Development Model](#development-model)
- [Technical Overview](#technical-overview)
- [Architecture Philosophy](#architecture-philosophy)
- [Quality Standards](#quality-standards)
- [Governance Framework](#governance-framework)
- [Current State](#current-state)
- [Strategic Direction](#strategic-direction)

---

## Project Identity

### Vision

Create an immersive multiplayer political simulation platform that enables players to experience democratic governance through authentic parliamentary procedures, strategic decision-making, and consequence-driven gameplay.

### Mission

Deliver captivating gameplay that authentically mirrors the complexity of real-world politics while fostering civic understanding through experiential learning. Maintain absolute political neutrality and democratic integrity.

### Core Values

1. **Democratic Integrity**: Absolute political neutrality, no manipulation of outcomes
2. **Security First**: Zero-trust architecture, encryption everywhere, comprehensive auditing
3. **Accessibility Mandatory**: WCAG 2.2 AA+ compliance is non-negotiable
4. **Privacy by Design**: Minimize data collection, protect user privacy, GDPR compliance
5. **Quality Assurance**: Test-driven development with 80%+ coverage targets
6. **Transparency**: Open documentation, auditable AI decisions, clear governance

### Target Audience

- **Primary**: Political enthusiasts, strategy gamers, civic educators
- **Secondary**: Students learning about democratic systems
- **Tertiary**: Political science researchers and simulation enthusiasts

---

## Development Model

### Solo Developer + AI Collaboration

Political Sphere is developed by a single human developer leveraging AI systems as collaborative coding partners:

#### Human Responsibilities

- Strategic decisions and architectural choices
- Code review and quality approval
- Governance and ethical oversight
- Final approval of all changes
- Security and compliance validation

#### AI Responsibilities

- Code generation and scaffolding
- Documentation writing
- Test generation
- Refactoring suggestions
- Pattern identification

#### Collaboration Workflow

1. **Planning**: Human defines requirements and acceptance criteria
2. **Implementation**: AI generates code, tests, and documentation
3. **Review**: Human validates output against standards
4. **Iteration**: AI refines based on feedback
5. **Validation**: Automated tools verify quality
6. **Approval**: Human approves and commits

#### Quality Safeguards

- **Automated Testing**: CI/CD pipelines catch errors
- **Security Scanning**: OWASP ZAP, Snyk, npm audit
- **Accessibility Testing**: axe-core, pa11y automated tests
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint, Prettier, Biome (evaluation)

---

## Technical Overview

### Monorepo Architecture

**Structure**: Nx workspace with clear separation of concerns

```
apps/           # 12+ deployable applications
libs/           # 17+ shared libraries
docs/           # 100+ documentation files
tools/          # Development tools and scripts
config/         # Configuration management
```

### Technology Stack Summary

**Frontend**: React 19 + TypeScript + Vite + Tailwind CSS  
**Backend**: Node.js 22 + Fastify + TypeScript  
**Database**: PostgreSQL 15 + Prisma ORM  
**Caching**: Redis 7  
**Testing**: Vitest + Playwright + axe-core  
**Infrastructure**: Docker + Kubernetes + Terraform + ArgoCD  
**Observability**: Pino + Prometheus + OpenTelemetry  
**AI**: Ollama (local models) + MCP integration

See [Technology Stack](./technology-stack.md) for comprehensive details.

### Key Applications

| Application        | Purpose                     | Technology                |
| ------------------ | --------------------------- | ------------------------- |
| **api**            | Main REST/GraphQL API       | Fastify + TypeScript      |
| **web**            | Primary web application     | React 19 + Vite           |
| **game-server**    | Real-time simulation engine | Node.js + WebSockets      |
| **worker**         | Background job processing   | Node.js + BullMQ          |
| **shell**          | Module federation host      | Webpack Module Federation |
| **\*-remote**      | Micro-frontends             | React + Module Federation |
| **infrastructure** | IaC and deployments         | Terraform + Kubernetes    |
| **e2e**            | End-to-end testing          | Playwright                |
| **load-test**      | Performance testing         | k6                        |

### Key Libraries

| Library         | Purpose                              | Usage                |
| --------------- | ------------------------------------ | -------------------- |
| **shared**      | Common utilities and types           | All apps             |
| **platform**    | Platform services (auth, API client) | Frontend apps        |
| **ui**          | Design system and components         | React apps           |
| **game-engine** | Game logic and simulation            | Game-server, worker  |
| **domain-\***   | Domain-specific business logic       | APIs, services       |
| **data-\***     | Data access layers                   | All backend services |
| **testing**     | Test utilities and factories         | All tests            |

---

## Architecture Philosophy

### Design Principles

1. **Domain-Driven Design**: Rich domain models with ubiquitous language
2. **Microservices**: Independently deployable services with clear boundaries
3. **Event-Driven**: Asynchronous communication for scalability
4. **CQRS**: Command-Query separation for complex domains
5. **Repository Pattern**: Data access abstraction
6. **Dependency Injection**: Loose coupling, testability

### Architectural Patterns

#### Frontend Patterns

- **Component Composition**: Reusable, composable components
- **Container/Presenter**: Separation of logic and presentation
- **Render Props & Hooks**: State and behavior sharing
- **Module Federation**: Micro-frontend architecture

#### Backend Patterns

- **Layered Architecture**: Presentation → Business Logic → Data Access
- **Repository Pattern**: Database abstraction
- **Service Layer**: Business logic encapsulation
- **DTO Pattern**: Data transfer objects for API boundaries
- **Factory Pattern**: Object creation encapsulation

#### Testing Patterns

- **Arrange-Act-Assert (AAA)**: Clear test structure
- **Test Factories**: Realistic test data generation
- **Mocking**: External dependency isolation
- **Test Pyramid**: Unit (70%) → Integration (20%) → E2E (10%)

---

## Quality Standards

### Code Quality

- **TypeScript**: Strict mode, no `any` types
- **Linting**: ESLint with strict rules, max warnings = 0
- **Formatting**: Prettier with consistent style
- **Type Coverage**: 100% for public APIs
- **Documentation**: JSDoc comments for public interfaces

### Testing Requirements

- **Unit Tests**: 80%+ coverage for critical business logic
- **Integration Tests**: API endpoints, database interactions
- **E2E Tests**: Critical user journeys
- **Accessibility Tests**: WCAG 2.2 AA validation on all UI
- **Security Tests**: Input validation, auth flows
- **Performance Tests**: Load testing for critical paths

### Security Standards

- **Zero-Trust**: Never assume trust at any layer
- **Encryption**: TLS 1.3+ in transit, AES-256-GCM at rest
- **Authentication**: JWT with secure refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schemas for all inputs
- **Secrets Management**: AWS Secrets Manager / Vault
- **Audit Logging**: Tamper-evident structured logs

### Accessibility Standards

- **WCAG 2.2 AA+**: Mandatory compliance
- **Semantic HTML**: Use proper HTML5 elements
- **ARIA**: Only where HTML semantics insufficient
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Optimized for assistive technologies
- **Contrast Ratios**: 4.5:1 for normal text, 3:1 for large

---

## Governance Framework

### Constitutional Principles

1. **Democratic Neutrality**: No political bias or manipulation
2. **Transparency**: All decisions auditable and explainable
3. **User Sovereignty**: Users control their data
4. **Fair Play**: No pay-to-win mechanics
5. **Content Moderation**: Clear rules, consistent enforcement

### AI Governance

- **Human Oversight**: All AI decisions subject to human review
- **Explainability**: AI outputs must be auditable
- **Bias Monitoring**: Regular audits for political bias
- **Constitutional Compliance**: AI cannot violate democratic principles
- **Privacy Protection**: Local AI models for sensitive operations

### Decision-Making

- **Technical Decisions**: Documented as ADRs (Architecture Decision Records)
- **Governance Decisions**: Require constitutional review
- **Security Decisions**: Zero-trust principles, security team review
- **Privacy Decisions**: GDPR compliance, data protection impact assessments

---

## Current State

### Development Status

| Category                   | Status         | Progress |
| -------------------------- | -------------- | -------- |
| **Core Infrastructure**    | ✅ Complete    | 95%      |
| **Authentication System**  | 🔄 In Progress | 85%      |
| **Game Engine**            | 🔄 In Progress | 60%      |
| **Frontend UI**            | 🔄 In Progress | 70%      |
| **API Endpoints**          | 🔄 In Progress | 65%      |
| **Testing Infrastructure** | ✅ Complete    | 90%      |
| **CI/CD Pipeline**         | ✅ Complete    | 95%      |
| **Documentation**          | 🔄 In Progress | 80%      |
| **Security Auditing**      | ✅ Complete    | 100%     |
| **Accessibility**          | 🔄 In Progress | 75%      |

### Recent Achievements

- ✅ Comprehensive security audit completed (31 issues identified)
- ✅ CI/CD pipeline fully automated with quality gates
- ✅ Testing infrastructure established (Vitest, Playwright, axe-core)
- ✅ Authentication system with JWT and session management
- ✅ Monorepo structure standardized with Nx
- ✅ Technology stack documentation completed

### Active Work

- 🔄 Frontend user experience enhancements
- 🔄 Game engine simulation logic
- 🔄 API endpoint implementation
- 🔄 Accessibility remediation (WCAG 2.2 AA+)
- 🔄 Performance optimization

### Known Issues

- ⚠️ TypeScript strict mode remediation ongoing
- ⚠️ Some E2E tests need updating
- ⚠️ Performance optimization needed for large datasets
- ⚠️ Documentation gaps in game mechanics

---

## Strategic Direction

### 2025 Roadmap

**Q4 2025** (Current)

- ✅ Core infrastructure and authentication
- 🔄 Game engine MVP
- 🔄 Frontend user experience
- 🔄 Documentation completion

**Q1 2026**

- 🎯 Beta launch with limited features
- 🎯 User testing and feedback
- 🎯 Performance optimization
- 🎯 Accessibility certification

**Q2 2026**

- 🎯 Public launch
- 🎯 AI NPC integration
- 🎯 Advanced game mechanics
- 🎯 Community features

**Q3-Q4 2026**

- 🎯 Internationalization
- 🎯 Mobile-responsive design
- 🎯 Advanced analytics
- 🎯 Educational partnerships

### Long-Term Vision

- **2027**: Multi-country political systems (US, Canada, Australia)
- **2028**: Educational curriculum integration
- **2029**: Research platform for political science
- **2030**: Global political simulation network

### Success Metrics

**Technical Metrics:**

- 99.9% uptime (three nines)
- < 200ms p95 API latency
- 80%+ test coverage
- Zero critical security vulnerabilities

**User Metrics:**

- 10,000+ active monthly users
- 4.5+ star user ratings
- < 5% bounce rate
- 60%+ retention after 30 days

**Quality Metrics:**

- WCAG 2.2 AAA certification
- A+ security rating (Mozilla Observatory)
- 100% Lighthouse accessibility score
- < 1% error rate

---

## Getting Started

### For Developers

1. **Read**: [Quick Reference Guide](../quick-ref.md)
2. **Setup**: [Development Environment](./organization.md)
3. **Learn**: [Technology Stack](./technology-stack.md)
4. **Code**: [Development Workflows](../05-engineering-and-devops/development/)
5. **Test**: [Testing Strategy](../05-engineering-and-devops/testing/)

### For Architects

1. **Read**: [System Architecture](../04-architecture/architecture.md)
2. **Review**: [ADR Index](../04-architecture/adr/)
3. **Understand**: [System Overview](../04-architecture/system-overview.md)
4. **Design**: [Domain-Driven Design Map](../04-architecture/domain-driven-design-map.md)

### For Security

1. **Read**: [Security Architecture](../06-security-and-risk/security.md)
2. **Review**: [Threat Modeling](../06-security-and-risk/threat-modeling-stride.md)
3. **Monitor**: [Risk Register](../06-security-and-risk/risk-register.md)
4. **Respond**: [Incident Response](../06-security-and-risk/incident-response/)

---

## Related Documentation

- [Vision & Mission](./vision-mission.md)
- [Core Values & Ethics](./core-values-ethics.md)
- [Technology Stack](./technology-stack.md)
- [Standards Overview](./standards/standards-overview.md)
- [TODO List](../TODO.md)
- [CHANGELOG](../../CHANGELOG.md)

---

**Version History:**

- **1.0.0** (2025-11-19): Initial comprehensive project context documentation
