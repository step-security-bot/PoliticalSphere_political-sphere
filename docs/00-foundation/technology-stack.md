# Technology Stack Reference

**Version:** 1.0.0  
**Last Updated:** 2025-11-19  
**Status:** Living Document

## Overview

This document provides a comprehensive reference of all technologies, frameworks, libraries, and tools used in the Political Sphere platform. It includes version requirements, purpose, decision rationale, and key considerations.

## Table of Contents

- [Core Technologies](#core-technologies)
- [Frontend Stack](#frontend-stack)
- [Backend Stack](#backend-stack)
- [Data Layer](#data-layer)
- [Infrastructure](#infrastructure)
- [Development Tools](#development-tools)
- [Testing Infrastructure](#testing-infrastructure)
- [Security & Compliance](#security--compliance)
- [Observability](#observability)
- [AI & Machine Learning](#ai--machine-learning)
- [Version Management](#version-management)

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Core Technologies

### Runtime Environments

| Technology     | Version  | Purpose                                 | Decision Rationale                                                 |
| -------------- | -------- | --------------------------------------- | ------------------------------------------------------------------ |
| **Node.js**    | 22.x LTS | JavaScript runtime for backend services | LTS stability, ESM support, performance, active ecosystem          |
| **TypeScript** | 5.x      | Type-safe development language          | Strict type checking, enhanced IDE support, reduced runtime errors |
| **ECMAScript** | ES2023+  | JavaScript language standard            | Modern syntax, async/await, modules, class fields                  |

### Monorepo Management

| Technology         | Version        | Purpose                                 | Decision Rationale                                             |
| ------------------ | -------------- | --------------------------------------- | -------------------------------------------------------------- |
| **Nx**             | 19.x           | Monorepo build system and orchestration | Intelligent caching, affected commands, workspace optimization |
| **npm workspaces** | 10.x           | Package management                      | Native npm support, simple configuration, workspace linking    |
| **pnpm**           | 8.x (optional) | Fast, disk-efficient package manager    | Faster installs, better disk usage, strict dependencies        |

---

## Frontend Stack

### Core Framework

| Technology       | Version | Purpose                   | Decision Rationale                                        |
| ---------------- | ------- | ------------------------- | --------------------------------------------------------- |
| **React**        | 19.x    | UI component library      | Server components, concurrent features, largest ecosystem |
| **Vite**         | 5.x     | Build tool and dev server | Fast HMR, ESM-native, optimized production builds         |
| **React Router** | 6.x     | Client-side routing       | Type-safe routing, nested routes, data loading            |

### State Management

| Technology        | Version | Purpose                       | Decision Rationale                                         |
| ----------------- | ------- | ----------------------------- | ---------------------------------------------------------- |
| **Redux Toolkit** | 2.x     | Global state management       | Predictable state, DevTools integration, RTK Query         |
| **RTK Query**     | 2.x     | Data fetching and caching     | Auto-generated hooks, cache management, optimistic updates |
| **React Context** | 19.x    | Local component state sharing | Built-in, simple API, no external dependencies             |

### Styling & Design

| Technology       | Version | Purpose                     | Decision Rationale                                   |
| ---------------- | ------- | --------------------------- | ---------------------------------------------------- |
| **Tailwind CSS** | 3.x     | Utility-first CSS framework | Rapid prototyping, consistent design, tree-shakeable |
| **PostCSS**      | 8.x     | CSS processing              | Plugin ecosystem, autoprefixer, optimization         |
| **CSS Modules**  | N/A     | Scoped CSS                  | Component-scoped styles, class name hashing          |

### Module Federation

| Technology                      | Version | Purpose                     | Decision Rationale                                                |
| ------------------------------- | ------- | --------------------------- | ----------------------------------------------------------------- |
| **Webpack Module Federation**   | 5.x     | Micro-frontend architecture | Independent deployments, shared dependencies, runtime integration |
| **@module-federation/enhanced** | 0.x     | Enhanced module federation  | Better TypeScript support, improved DX                            |

---

## Backend Stack

### Core Framework

| Technology     | Version      | Purpose                        | Decision Rationale                                             |
| -------------- | ------------ | ------------------------------ | -------------------------------------------------------------- |
| **Fastify**    | 4.x          | High-performance web framework | Fastest Node.js framework, plugin ecosystem, schema validation |
| **Express.js** | 4.x (legacy) | Traditional web framework      | Wide adoption, middleware ecosystem (migrating to Fastify)     |

### API & Validation

| Technology    | Version | Purpose                     | Decision Rationale                                                      |
| ------------- | ------- | --------------------------- | ----------------------------------------------------------------------- |
| **Zod**       | 3.x     | Runtime schema validation   | Type inference, composable schemas, error messages                      |
| **GraphQL**   | 16.x    | Query language for APIs     | Type-safe queries, efficient data fetching, client-controlled responses |
| **Mercurius** | 14.x    | GraphQL adapter for Fastify | High performance, subscriptions, Federation support                     |
| **OpenAPI**   | 3.1.x   | REST API specification      | Standardized documentation, code generation, validation                 |

### Authentication & Authorization

| Technology       | Version | Purpose                           | Decision Rationale                                   |
| ---------------- | ------- | --------------------------------- | ---------------------------------------------------- |
| **jsonwebtoken** | 9.x     | JWT token generation/verification | Industry standard, stateless auth, secure claims     |
| **bcrypt**       | 5.x     | Password hashing                  | Strong cryptographic hashing, salting, tuneable cost |
| **@fastify/jwt** | 8.x     | Fastify JWT plugin                | Integrated JWT support, decorators, hooks            |

---

## Data Layer

### Databases

| Technology     | Version   | Purpose                     | Decision Rationale                                             |
| -------------- | --------- | --------------------------- | -------------------------------------------------------------- |
| **PostgreSQL** | 15.x      | Primary relational database | ACID compliance, JSON support, full-text search, extensibility |
| **Redis**      | 7.x       | Caching and pub/sub         | In-memory speed, pub/sub patterns, session storage             |
| **SQLite**     | 3.x (dev) | Local development database  | Zero-config, file-based, quick prototyping                     |

### ORM & Query Builders

| Technology | Version             | Purpose                     | Decision Rationale                                    |
| ---------- | ------------------- | --------------------------- | ----------------------------------------------------- |
| **Prisma** | 5.x                 | Type-safe ORM               | Auto-generated types, migrations, schema-first design |
| **Kysely** | 0.27.x (evaluation) | Type-safe SQL query builder | Fine-grained control, raw SQL support, type inference |

### Data Validation & Transformation

| Technology            | Version | Purpose               | Decision Rationale                             |
| --------------------- | ------- | --------------------- | ---------------------------------------------- |
| **class-validator**   | 0.14.x  | DTO validation        | Decorator-based validation, NestJS integration |
| **class-transformer** | 0.5.x   | Object transformation | Plain-to-class conversion, serialization       |

---

## Infrastructure

### Containerization

| Technology         | Version | Purpose                       | Decision Rationale                                             |
| ------------------ | ------- | ----------------------------- | -------------------------------------------------------------- |
| **Docker**         | 24.x    | Container runtime             | Industry standard, consistent environments, multi-stage builds |
| **Docker Compose** | 2.x     | Multi-container orchestration | Local development, service dependencies, easy setup            |

### Container Orchestration

| Technology     | Version | Purpose                    | Decision Rationale                              |
| -------------- | ------- | -------------------------- | ----------------------------------------------- |
| **Kubernetes** | 1.28.x  | Production orchestration   | Auto-scaling, self-healing, declarative config  |
| **Helm**       | 3.x     | Kubernetes package manager | Reusable charts, templating, release management |

### Infrastructure as Code

| Technology    | Version          | Purpose                           | Decision Rationale                         |
| ------------- | ---------------- | --------------------------------- | ------------------------------------------ |
| **Terraform** | 1.6.x            | Cloud infrastructure provisioning | Declarative, multi-cloud, state management |
| **AWS CDK**   | 2.x (evaluation) | Cloud infrastructure as code      | Type-safe infrastructure, AWS-native       |

### GitOps & Deployment

| Technology         | Version | Purpose                    | Decision Rationale                                  |
| ------------------ | ------- | -------------------------- | --------------------------------------------------- |
| **ArgoCD**         | 2.9.x   | GitOps continuous delivery | Declarative deployments, drift detection, rollbacks |
| **GitHub Actions** | N/A     | CI/CD automation           | Native GitHub integration, matrix builds, secrets   |

---

## Development Tools

### Code Quality

| Technology   | Version          | Purpose                       | Decision Rationale                             |
| ------------ | ---------------- | ----------------------------- | ---------------------------------------------- |
| **ESLint**   | 9.x              | JavaScript/TypeScript linting | Configurable rules, plugin ecosystem, auto-fix |
| **Prettier** | 3.x              | Code formatting               | Consistent style, opinionated, zero-config     |
| **Biome**    | 1.x (evaluation) | Fast linter and formatter     | Performance, all-in-one tool, TypeScript-first |
| **Knip**     | 5.x              | Unused code detection         | Find dead exports, dependencies, config issues |

### Development Servers

| Technology  | Version      | Purpose                 | Decision Rationale                                  |
| ----------- | ------------ | ----------------------- | --------------------------------------------------- |
| **tsx**     | 4.x          | TypeScript execution    | Fast, ESM support, watch mode, no config            |
| **nodemon** | 3.x (legacy) | Auto-restart on changes | File watching, custom extensions (migrating to tsx) |

### AI Development Tools

| Technology                       | Version | Purpose                  | Decision Rationale                            |
| -------------------------------- | ------- | ------------------------ | --------------------------------------------- |
| **GitHub Copilot**               | N/A     | AI code completion       | Context-aware suggestions, multi-file support |
| **MCP (Model Context Protocol)** | 1.x     | AI assistant integration | Standardized AI tool interface, extensible    |

---

## Testing Infrastructure

### Unit & Integration Testing

| Technology                    | Version | Purpose                 | Decision Rationale                                                 |
| ----------------------------- | ------- | ----------------------- | ------------------------------------------------------------------ |
| **Vitest**                    | 1.x     | Unit test runner        | Fast, Vite-native, Jest-compatible API, ESM support                |
| **Testing Library**           | 14.x    | React component testing | User-centric testing, accessibility focus, simple API              |
| **MSW (Mock Service Worker)** | 2.x     | API mocking             | Intercepts network requests, realistic mocks, browser/Node support |

### End-to-End Testing

| Technology         | Version | Purpose                           | Decision Rationale                                         |
| ------------------ | ------- | --------------------------------- | ---------------------------------------------------------- |
| **Playwright**     | 1.40.x  | E2E test automation               | Multi-browser, parallel execution, reliable selectors      |
| **Testcontainers** | 10.x    | Container-based integration tests | Real dependencies, isolated tests, disposable environments |

### Test Data Management

| Technology  | Version | Purpose                       | Decision Rationale                                    |
| ----------- | ------- | ----------------------------- | ----------------------------------------------------- |
| **Fishery** | 2.x     | Factory pattern for test data | Type-safe factories, relationships, sequences         |
| **Faker**   | 8.x     | Fake data generation          | Realistic test data, localization, consistent seeding |

### Accessibility Testing

| Technology   | Version | Purpose                         | Decision Rationale                                     |
| ------------ | ------- | ------------------------------- | ------------------------------------------------------ |
| **axe-core** | 4.x     | Automated accessibility testing | WCAG validation, comprehensive ruleset, CI integration |
| **pa11y**    | 8.x     | Accessibility auditing          | CLI tool, custom runners, HTML reports                 |
| **jest-axe** | 8.x     | Jest/Vitest integration         | Automated WCAG testing, custom matchers                |

### Security Testing

| Technology    | Version | Purpose                           | Decision Rationale                                 |
| ------------- | ------- | --------------------------------- | -------------------------------------------------- |
| **OWASP ZAP** | 2.14.x  | Dynamic security testing (DAST)   | Industry standard, comprehensive scans, automation |
| **Snyk**      | 1.x     | Dependency vulnerability scanning | CVE detection, fix suggestions, CI integration     |
| **npm audit** | 10.x    | Dependency security audits        | Built-in, automatic scans, severity levels         |

### Performance Testing

| Technology    | Version          | Purpose                      | Decision Rationale                                         |
| ------------- | ---------------- | ---------------------------- | ---------------------------------------------------------- |
| **k6**        | 0.48.x           | Load testing                 | Scripted scenarios, metrics, scalable, Grafana integration |
| **Artillery** | 2.x (evaluation) | Load and performance testing | YAML config, realistic scenarios, plugins                  |

---

## Security & Compliance

### Encryption & Secrets

| Technology              | Version             | Purpose                       | Decision Rationale                                    |
| ----------------------- | ------------------- | ----------------------------- | ----------------------------------------------------- |
| **AWS Secrets Manager** | N/A                 | Secret storage and rotation   | Managed service, automatic rotation, audit logs       |
| **HashiCorp Vault**     | 1.15.x (evaluation) | Secret management             | Self-hosted, dynamic secrets, encryption as a service |
| **SOPS**                | 3.x                 | Encrypted configuration files | Git-friendly, multiple backends, key rotation         |

### Compliance & Standards

| Standard           | Version | Purpose                           | Decision Rationale                                         |
| ------------------ | ------- | --------------------------------- | ---------------------------------------------------------- |
| **WCAG**           | 2.2 AA+ | Web accessibility guidelines      | Legal compliance, inclusive design, best practices         |
| **OWASP ASVS**     | 5.0.0   | Application security verification | Security requirements, testing guidance, industry standard |
| **NIST SP 800-53** | Rev 5   | Security controls framework       | Comprehensive controls, risk management, compliance        |
| **GDPR**           | Current | Data protection regulation        | Legal requirement (UK/EU), user privacy, data sovereignty  |

---

## Observability

### Logging

| Technology       | Version | Purpose                 | Decision Rationale                                          |
| ---------------- | ------- | ----------------------- | ----------------------------------------------------------- |
| **Pino**         | 8.x     | Structured JSON logging | High performance, low overhead, child loggers               |
| **Grafana Loki** | 2.x     | Log aggregation         | Cost-effective, Prometheus-like labels, Grafana integration |

### Metrics

| Technology      | Version | Purpose                        | Decision Rationale                                    |
| --------------- | ------- | ------------------------------ | ----------------------------------------------------- |
| **Prometheus**  | 2.x     | Metrics collection and storage | Industry standard, PromQL, service discovery          |
| **Grafana**     | 10.x    | Metrics visualization          | Rich dashboards, alerting, multi-source support       |
| **prom-client** | 15.x    | Prometheus client for Node.js  | Metrics collection, custom metrics, histogram support |

### Tracing

| Technology        | Version          | Purpose                         | Decision Rationale                                  |
| ----------------- | ---------------- | ------------------------------- | --------------------------------------------------- |
| **OpenTelemetry** | 1.x              | Distributed tracing standard    | Vendor-neutral, auto-instrumentation, unified API   |
| **Jaeger**        | 1.x (evaluation) | Trace storage and visualization | Open-source, distributed tracing, service graph     |
| **Tempo**         | 2.x (evaluation) | Trace backend for Grafana       | Cost-effective, object storage, Grafana integration |

### Application Performance Monitoring

| Technology                  | Version | Purpose             | Decision Rationale                                      |
| --------------------------- | ------- | ------------------- | ------------------------------------------------------- |
| **@opentelemetry/api**      | 1.x     | APM instrumentation | Standard API, auto-instrumentation, context propagation |
| **@opentelemetry/sdk-node** | 0.48.x  | OpenTelemetry SDK   | Exporters, processors, resource detection               |

---

## AI & Machine Learning

### AI Development

| Technology    | Version            | Purpose                    | Decision Rationale                                        |
| ------------- | ------------------ | -------------------------- | --------------------------------------------------------- |
| **Ollama**    | 0.1.x              | Local AI model hosting     | Privacy-first, self-hosted, no API costs, multiple models |
| **LangChain** | 0.1.x (evaluation) | AI orchestration framework | Chain building, agents, memory management                 |

### AI Governance

| Technology            | Version | Purpose              | Decision Rationale                                      |
| --------------------- | ------- | -------------------- | ------------------------------------------------------- |
| **Constitutional AI** | Custom  | AI safety framework  | Democratic neutrality, bias prevention, human oversight |
| **Audit Logging**     | Custom  | AI decision tracking | Transparency, explainability, compliance                |

---

## Version Management

### Version Control

| Technology   | Version | Purpose                        | Decision Rationale                                 |
| ------------ | ------- | ------------------------------ | -------------------------------------------------- |
| **Git**      | 2.x     | Version control system         | Industry standard, branching, collaboration        |
| **GitHub**   | N/A     | Code hosting and collaboration | CI/CD integration, PR workflows, security scanning |
| **Lefthook** | 1.x     | Git hooks management           | Fast, parallel execution, YAML config              |

### Semantic Versioning

All packages and applications follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features, backward-compatible
- **PATCH**: Bug fixes, backward-compatible

### Dependency Management Strategy

1. **Lock Files**: Commit `package-lock.json` / `pnpm-lock.yaml` for reproducible builds
2. **Version Pinning**: Pin major versions, allow minor/patch updates
3. **Regular Updates**: Weekly dependency updates with automated testing
4. **Security Patches**: Immediate updates for critical vulnerabilities
5. **LTS Preference**: Prefer Long-Term Support (LTS) versions for stability

---

## Decision Matrix

### Why We Chose These Technologies

#### React over Angular/Vue

- **Ecosystem**: Largest component library ecosystem
- **Hiring**: Most developers know React
- **Performance**: Virtual DOM, concurrent features
- **Stability**: Backed by Meta, mature ecosystem

#### TypeScript over JavaScript

- **Type Safety**: Catch errors at compile time
- **IDE Support**: Better autocomplete and refactoring
- **Documentation**: Types serve as inline documentation
- **Maintainability**: Easier to refactor and scale

#### Fastify over Express

- **Performance**: 2-3x faster than Express
- **Schema Validation**: Built-in JSON Schema support
- **Modern**: Async/await first, ESM support
- **Plugin System**: Encapsulated, testable plugins

#### PostgreSQL over MySQL/MongoDB

- **Compliance**: ACID guarantees for voting integrity
- **Features**: JSON, full-text search, geospatial
- **Performance**: Query optimization, indexing
- **Ecosystem**: Mature tooling, extensions

#### Vitest over Jest

- **Speed**: 10x faster test execution
- **ESM Support**: Native ESM, no transpilation
- **Vite Integration**: Shared config with build tool
- **Modern**: Better TypeScript support

#### Nx over Lerna/Turborepo

- **Affected Commands**: Only build/test what changed
- **Caching**: Intelligent build caching
- **Generators**: Code scaffolding and automation
- **Plugins**: Rich ecosystem for React, Node.js, etc.

---

## Evaluation & Future Considerations

### Under Evaluation

| Technology    | Purpose                                   | Status                 | Decision Timeline |
| ------------- | ----------------------------------------- | ---------------------- | ----------------- |
| **Biome**     | Replace ESLint + Prettier                 | Proof of concept       | Q1 2026           |
| **Kysely**    | Alternative to Prisma for complex queries | Testing                | Q2 2026           |
| **Bun**       | Fast JavaScript runtime                   | Monitoring maturity    | Q3 2026           |
| **Temporal**  | Workflow orchestration                    | Requirements gathering | Q2 2026           |
| **Turbopack** | Webpack replacement                       | Waiting for stability  | Q4 2026           |

### Deprecated Technologies

| Technology     | Replaced By      | Reason                   | Timeline          |
| -------------- | ---------------- | ------------------------ | ----------------- |
| **Express.js** | Fastify          | Performance, modern API  | Migrating 2025-Q4 |
| **nodemon**    | tsx              | Speed, ESM support       | Complete          |
| **SQLite**     | PostgreSQL (dev) | Feature parity with prod | Q1 2026           |

---

## Related Documentation

- [Architecture Overview](../04-architecture/architecture.md)
- [System Overview](../04-architecture/system-overview.md)
- [Development Workflows](../05-engineering-and-devops/workflows.md)
- [Security Architecture](../06-security-and-risk/security.md)
- [Testing Strategy](../05-engineering-and-devops/testing/)

---

**Version History:**

- **1.0.0** (2025-11-19): Initial comprehensive technology stack documentation
