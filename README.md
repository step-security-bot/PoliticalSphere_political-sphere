# Political Sphere

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![Tests](https://img.shields.io/badge/tests-in%20progress-yellow)](docs/TODO.md)
[![Coverage](https://codecov.io/gh/political-sphere/political-sphere/branch/main/graph/badge.svg)](https://codecov.io/gh/political-sphere/political-sphere)
[![Audit](https://img.shields.io/badge/audit-completed-green)](#project-status)

🌍 **Political Sphere** is an immersive online multiplayer political simulation platform inspired by the UK's parliamentary system. Dive into the heart of democracy where players draft legislation, engage in heated debates, forge alliances, and cast votes that shape a virtual nation's destiny.

Experience the thrill of governance as your choices ripple through realistic simulations affecting the economy, public sentiment, and societal dynamics. Whether you're a seasoned strategist or a curious newcomer, Political Sphere offers an unparalleled journey into the intricacies of democratic decision-making.

Our mission: Deliver captivating gameplay that authentically mirrors the chaos and brilliance of real-world politics, while fostering civic understanding through experiential learning. No agendas, no biases—just pure, consequence-driven democracy in action.

### Project Characteristics

- **Development Model**: Solo developer project leveraging AI systems as collaborative coding partners
- **Scale**: Nx monorepo with 12+ applications and 17+ shared libraries
- **Architecture**: Microservices with domain-driven design and event-driven patterns
- **Technology Focus**: TypeScript-first with strict type safety, modern React patterns, and high-performance Node.js backend
- **Quality Standards**: Enterprise-grade testing (80%+ coverage), security (zero-trust), and accessibility (WCAG 2.2 AA+)
- **Documentation**: Comprehensive documentation across 12+ structured sections with 100+ documents
- **Governance**: Constitutional framework ensuring democratic neutrality and ethical AI use
- **CI/CD**: Automated testing, security scanning, and deployment with quality gates
- **Observability**: Structured logging, distributed tracing (OpenTelemetry), and metrics (Prometheus)

**AI Integration:**

- **🤖 Development**: AI assistants are used for the vast majority of development tasks — including drafting code, generating documentation, and creating tests. This use of AI is experimental and operates within evolving guardrails that focus on governance, compliance, and security. Because of the experimental nature of AI, unexpected or incorrect outputs may occur, and every AI-generated change is monitored, reviewed, and ultimately approved by a human developer.

The review process prioritises iteration over perfection. At times, code that contains known issues or incomplete logic is intentionally committed to the codebase — not as a final implementation, but as a checkpoint to capture progress and context. These issues are then revisited at the appropriate stage in development, allowing the project to maintain momentum. The sole human developer uses structured prompts to encourage the AI to identify, reflect on, and correct its own mistakes as part of the iterative review process. External validation tools (linters, type checkers, test suites, and security scanners) are used wherever possible to verify AI-generated work.

- **🎮 Gameplay**: AI-driven NPCs participate in voting, providing realistic opposition and filling empty parliamentary seats using locally-hosted Ollama models
- **🏛️ Governance**: Constitutional framework ensures AI systems cannot manipulate political outcomes or violate democratic principles (see `docs/02-governance/`)
- **🔍 Transparency**: All AI decisions are auditable, explainable, and subject to human oversight with comprehensive logging

## Table of Contents

- [Project Status](#project-status)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [License](#license)

## Project Status

| Category             | Status            | Details                                       |
| -------------------- | ----------------- | --------------------------------------------- |
| **Unit Tests**       | 🔄 In Progress    | ~130 tests passing, coverage improving        |
| **Test Coverage**    | 🔄 In Progress    | Target: 80%+ critical paths                   |
| **Security Audit**   | ✅ Completed      | 31 issues identified, remediation in progress |
| **CI/CD Pipeline**   | ✅ Active         | Automated testing and security scans          |
| **Production Ready** | 🚧 In Development | MVP features implemented, hardening ongoing   |

## ✨ Features

### Core Gameplay Features

- 🏛️ **Parliamentary Democracy Simulation**: Full UK-inspired parliamentary system with Westminster-style procedures, Question Time, and legislative processes
- 🗳️ **Electoral System**: FPTP and proportional representation voting mechanisms with constituency simulation
- 📜 **Legislative Framework**: Draft, debate, amend, and vote on bills with realistic parliamentary procedures
- 🤝 **Coalition Building**: Form parties, create coalitions, negotiate deals, and manage political relationships
- 📊 **Dynamic Political Landscape**: Public opinion polls, media influence, and real-time reputation systems
- 🎭 **Role Progression**: Start as backbencher, rise to party leadership, cabinet positions, or Prime Minister
- 💼 **Government Formation**: Cabinet appointments, shadow cabinet, ministerial responsibilities

### Technical Excellence

- 🧪 **Comprehensive Testing Infrastructure**:
  - Unit tests (Vitest) with 80%+ coverage targets
  - Integration tests with Testcontainers for database/service testing
  - E2E tests (Playwright) for critical user journeys
  - Accessibility tests (axe-core, pa11y) for WCAG 2.2 AA+ validation
  - Security tests (OWASP ZAP, Snyk) integrated in CI/CD
  - Performance tests (k6) for load testing and benchmarking
- 🔒 **Zero-Trust Security Architecture**:
  - End-to-end encryption (TLS 1.3+ in transit, AES-256-GCM at rest)
  - JWT authentication with secure refresh token rotation
  - Input validation and sanitization (Zod schemas)
  - Rate limiting and DDoS protection
  - Comprehensive audit logging with tamper-evident trails
  - OWASP ASVS v5.0.0 compliance
- ♿ **Accessibility First**:
  - WCAG 2.2 AA+ compliance across all interfaces
  - Full keyboard navigation support
  - Screen reader optimization with semantic HTML and ARIA labels
  - High contrast modes and customizable text scaling
  - Automated accessibility testing in CI pipeline
- 🤖 **Ethical AI Integration**:
  - Constitutional governance boundaries preventing political manipulation
  - AI NPCs powered by locally-hosted Ollama models (privacy-first)
  - Transparent, explainable AI decisions with comprehensive audit logs
  - Human-in-the-loop oversight for critical political content
  - Bias monitoring and fairness metrics

### Developer Experience

- 📦 **Modern Monorepo**: Nx workspace with intelligent build caching and affected command support
- 🔄 **Hot Module Replacement**: Instant feedback with Vite for frontend and tsx watch for backend
- 🎯 **TypeScript Strict Mode**: Full type safety across the entire codebase
- 📝 **Comprehensive Documentation**: 100+ documents across 12 structured sections
- 🛠️ **Developer Tools**:
  - AI-assisted development with Model Context Protocol (MCP) integration
  - Automated code generation and scaffolding
  - Performance monitoring and optimization tools
  - Database migrations and seeding scripts
  - Visual regression testing

### Infrastructure & Operations

- 🐳 **Containerized Development**: Docker Compose for consistent local environments
- ☸️ **Kubernetes Ready**: Helm charts and manifests for production deployment
- 📊 **Observability Built-In**:
  - Structured JSON logging with Pino
  - Distributed tracing with OpenTelemetry
  - Metrics collection with Prometheus
  - Grafana dashboards for system health
  - Alert management with configurable thresholds
- 🚀 **GitOps Deployment**: ArgoCD for declarative, version-controlled deployments
- 🔐 **Secrets Management**: Secure handling with AWS Secrets Manager / HashiCorp Vault
- 📈 **Performance Optimization**:
  - Redis caching for frequently accessed data
  - PostgreSQL query optimization and indexing
  - CDN integration for static assets
  - Load balancing with health checks

## Installation

### Prerequisites

- **Node.js**: 18.0.0 or higher (LTS recommended)
- **npm**: Latest version (comes with Node.js)
- **Docker & Docker Compose**: Recommended for full development environment
- **Git**: For version control

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/political-sphere.git
cd political-sphere

# Install dependencies
npm install

# Optional: Run health checks
npm run preflight
```

## Quick Start

For the impatient:

```bash
git clone https://github.com/your-org/political-sphere.git
cd political-sphere
npm install
npm run dev
```

Visit `http://localhost:3000` to start exploring the political simulation.

## Usage

### Development Servers

```bash
# Start all services with Docker (recommended)
npm run dev

# Or start individual services
npm run dev:api          # Start API server with hot reload
npm run dev:web          # Start frontend with Vite dev server
npm run dev:game-server  # Start game simulation server
```

### Build

```bash
npm run build:web        # Build the frontend for production
npm run build:api        # Build the API (TypeScript compilation)
```

### AI-Assisted Development

```bash
npm run ai:improve       # AI code review and suggestions
npm run ai:status        # Check AI assistant status
npm run ai:chat          # Interactive AI assistant
```

## Development

### Available Commands

- `npm run lint` — ESLint with auto-fix and validation
- `npm run format` — Prettier code formatting
- `npm run type-check` — TypeScript type checking
- `npm run test` — Run all unit tests
- `npm run test:coverage` — Generate test coverage reports
- `npm run test:smoke` — Run critical path E2E tests
- `npm run audit` — Security and compliance scanning
- `npm run perf:benchmark` — Performance benchmarking

### Project Structure

```
apps/                    # Applications
├── dev/                 # Development environment, tools, and sandbox
├── game-server/         # Game simulation engine (TypeScript + Node.js)

libs/                    # Shared libraries and utilities (TBD)

docs/                    # Documentation
├── ...                  # Various guides and architecture docs

tools/                   # Development tools and automation
├── scripts/             # Build, test, and utility scripts
├── mcp-servers/         # MCP server implementations
├── monitoring/          # Performance and system monitoring
└── docker-compose.yml   # Development environment setup

data/                    # Test data, fixtures, and seeds
├── fixtures/            # Test scenarios and user data
├── datasets/            # Data catalogs
└── runtime/             # Runtime data storage

prisma/                  # Database schema and migrations

.github/                 # GitHub workflows and templates

ai/                      # AI-assisted development tools

assets/                  # Static assets and resources

config/                  # Configuration files

reports/                 # Generated reports and analytics
```

## Testing

Run comprehensive tests:

```bash
npm run test              # All unit tests
npm run test:coverage     # Unit tests with coverage report
npm run test:smoke        # Critical path E2E tests
npm run test:api          # API-specific unit tests
npm run test:frontend     # Frontend component tests
```

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage for critical business logic
- **Integration Tests**: API endpoints and database interactions
- **E2E Tests**: Critical user journeys and accessibility
- **Security Tests**: Input validation and authentication flows

## Contributing

See [.blackboxrules](.blackboxrules) for governance rules.

### Development Workflow

1. **Fork and clone** the repository
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Follow conventional commits**: Use `feat:`, `fix:`, `docs:`, `test:` prefixes
4. **Ensure quality gates pass**:
   - `npm run lint` - Code quality
   - `npm run type-check` - TypeScript validation
   - `npm run test` - Unit tests
   - `npm run audit` - Security scanning
5. **Submit a PR** with comprehensive description and link to any related issues

### Governance Rules

- **Democratic Integrity**: No manipulation of political outcomes
- **Security First**: Zero-trust principles, input validation, no secrets in code
- **Accessibility**: WCAG 2.2 AA compliance mandatory
- **Testing**: Comprehensive automated testing required
- **AI Ethics**: AI cannot influence political outcomes or bias results

## 🧠 Development Philosophy

Political Sphere embraces a **human-AI collaborative development model** where AI accelerates progress while maintaining human oversight and ethical boundaries. Our core principles:

- **Iterative Excellence**: Prioritize momentum over perfection; commit working code early and refine iteratively
- **Ethical AI Use**: AI assists development but never compromises democratic integrity or security
- **Open Governance**: All decisions follow transparent, documented processes with community input
- **Quality Assurance**: Comprehensive testing, security audits, and accessibility checks are non-negotiable
- **Educational Impact**: Build systems that teach democratic principles through immersive experience

## Documentation

### Architecture & Design

- [System Architecture](docs/STRUCTURE.md)
- [API Documentation](docs/04-architecture/api.md)
- [Security Guidelines](docs/06-security-and-risk/SECURITY.md)

### Development Guides

- [Coding Standards](docs/05-engineering-and-devops/coding-standards-typescript-react.md)
- [Testing Guide](docs/05-engineering-and-devops/testing/)
- [AI Governance](docs/07-ai-and-simulation/ai-governance.md)

### Project Management

- [TODO List](docs/TODO.md)
- [ADR Index](docs/04-architecture/adr/)

## System Requirements

### Minimum Requirements

- **Node.js**: 18.0.0 or higher
- **Memory**: 4GB RAM
- **Storage**: 2GB free space
- **OS**: macOS 12+, Windows 10+, Linux (Ubuntu 20.04+)

### Recommended for Development

- **Node.js**: 20.x LTS
- **Memory**: 8GB RAM
- **Storage**: 5GB free space
- **Docker**: For full development environment

## Architecture Overview

Political Sphere is built as an **Nx monorepo** with **microservices architecture** and **domain-driven design** principles:

### Core Technology Stack

#### Frontend Layer

- **Framework**: React 19 + TypeScript (strict mode)
- **Build Tool**: Vite with ESM support
- **State Management**: Redux Toolkit + RTK Query
- **Styling**: Tailwind CSS with custom design system
- **Module Federation**: Micro-frontends for independent deployability
- **Accessibility**: WCAG 2.2 AA+ compliance with automated testing (axe-core)
- **Testing**: Vitest + Testing Library + Playwright E2E

#### Backend Layer

- **Runtime**: Node.js 22+ (LTS)
- **Framework**: Fastify (lightweight, high-performance REST/GraphQL APIs)
- **Language**: TypeScript with strict type checking
- **API Style**: REST + GraphQL with OpenAPI/JSON Schema validation
- **Authentication**: JWT with secure session management and refresh tokens
- **Validation**: Zod schemas for runtime type safety

#### Data Layer

- **Primary Database**: PostgreSQL 15+ with Prisma ORM
- **Caching**: Redis for sessions, pub/sub, and data caching
- **Search**: PostgreSQL full-text search (with future Elasticsearch consideration)
- **Storage**: Local file storage (S3-compatible for production)
- **Migrations**: Prisma migrations with version control

#### Game Engine

- **Simulation Engine**: Custom deterministic simulation in TypeScript
- **AI NPCs**: Ollama-powered local AI models for realistic political opponents
- **Event System**: NATS/Redis pub/sub for real-time game events
- **State Management**: PostgreSQL with transactional consistency

#### Infrastructure & DevOps

- **Containerization**: Docker + Docker Compose for local development
- **Orchestration**: Kubernetes with Helm charts (production)
- **IaC**: Terraform for infrastructure provisioning
- **GitOps**: ArgoCD for declarative deployments
- **CI/CD**: GitHub Actions with comprehensive quality gates
- **Monitoring**: Prometheus + Grafana + OpenTelemetry for observability

#### Testing Infrastructure

- **Unit Testing**: Vitest with 80%+ coverage targets
- **Integration Testing**: Testcontainers for database/service testing
- **E2E Testing**: Playwright for critical user journeys
- **Accessibility Testing**: axe-core + pa11y for WCAG validation
- **Security Testing**: OWASP ZAP, npm audit, Snyk
- **Performance Testing**: k6 for load testing and benchmarking

#### Security & Compliance

- **Architecture**: Zero-trust security model with principle of least privilege
- **Encryption**: TLS 1.3+ in transit, AES-256-GCM at rest
- **Secrets Management**: AWS Secrets Manager / HashiCorp Vault
- **Audit Logging**: Tamper-evident structured logs with retention policies
- **Compliance**: GDPR-first design, OWASP ASVS v5.0.0, NIST guidelines

### Architectural Patterns

- **Microservices**: Independently deployable services with clear bounded contexts
- **Domain-Driven Design**: Rich domain models with ubiquitous language
- **CQRS**: Command-Query separation for complex domains (elections, legislation)
- **Event-Driven**: Asynchronous communication via message queues and pub/sub
- **API Gateway**: Centralized API routing with rate limiting and authentication
- **Repository Pattern**: Data access abstraction with Prisma
- **Factory Pattern**: Test data generation with Fishery + Faker

### Monorepo Structure

```
apps/           # 12+ deployable applications
  ├── api/              # Main REST/GraphQL API service
  ├── web/              # Primary React web application
  ├── game-server/      # Real-time game simulation engine
  ├── worker/           # Background job processing
  ├── shell/            # Module federation host
  ├── *-remote/         # Micro-frontend applications
  └── infrastructure/   # IaC and deployment configurations

libs/           # 17+ shared libraries
  ├── shared/           # Common utilities and types
  ├── platform/         # Platform services (auth, API client, state)
  ├── ui/               # Design system and React components
  ├── game-engine/      # Game logic and simulation
  ├── domain-*/         # Domain-specific business logic
  ├── data-*/           # Data access layers
  └── testing/          # Test utilities and factories

docs/           # Comprehensive documentation (12+ sections)
tools/          # Development tools and scripts
config/         # Configuration files
```

### Key Design Principles

1. **Democratic Integrity**: Absolute political neutrality with constitutional governance
2. **Security First**: Zero-trust model, encryption everywhere, comprehensive auditing
3. **Accessibility Mandatory**: WCAG 2.2 AA+ compliance, keyboard navigation, screen reader support
4. **Test-Driven Quality**: 80%+ coverage, automated testing at all levels
5. **Observability Built-In**: Structured logging, distributed tracing, metrics collection
6. **Privacy by Design**: Data minimization, GDPR compliance, user data sovereignty

## API Overview

- **Base URL**: `http://localhost:3001` (development)
- **Authentication**: JWT with refresh tokens
- **Rate Limiting**: Configurable per endpoint
- **API Documentation**: [View API Documentation](docs/04-architecture/api.md)

### Key Endpoints

- `GET /health` - Service health check
- `POST /auth/login` - User authentication
- `GET /votes` - List active votes and proposals
- `POST /votes/{voteId}/cast` - Cast votes on proposals
- `GET /parties` - View political parties
- `POST /parties` - Create political parties
- `GET /news` - Browse news articles

## Deployment

### Local Development

```bash
npm run dev              # Start all services with Docker
```

### Production

- Kubernetes manifests in `apps/infrastructure/`
- GitOps deployment via ArgoCD
- Automated CI/CD pipelines with security scanning

## FAQ

### What is Political Sphere?

Political Sphere is a multiplayer simulation game that lets players experience democratic governance through parliamentary procedures, policy-making, and coalition-building in a virtual UK-inspired political system.

### How does AI integration work?

AI assistants help with development tasks and power in-game NPCs for realistic opposition. All AI systems are governed by strict ethical frameworks to ensure neutrality and prevent manipulation of political outcomes.

### Is the game free?

Yes, Political Sphere is open-source and free to play. The project focuses on educational and entertainment value rather than monetization.

### Can I contribute?

Absolutely! See the Contributing section above and our [.blackboxrules](.blackboxrules) for governance guidelines. We welcome contributions that align with our principles of democratic integrity and security.

### What technologies are used?

The project is built with Node.js, TypeScript, React, and various modern web technologies. It uses an Nx monorepo structure for scalable development.

## Troubleshooting

### Common Issues

**API won't start**

```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and reinstall
npm run perf:cache-clear
npm install
```

**Tests failing**

```bash
# Clear test cache
npm run perf:cache-clear

# Run specific failing tests
npm run test:api
```

**Docker issues**

```bash
# Check Docker resources
docker system df

# Clean up containers
npm run cleanup
```

**Performance issues**

```bash
# Clear all caches
npm run perf:full

# Check system resources
npm run perf:check
```

**Database connection issues**

```bash
# Check database status
npm run dev  # Start all services

# Reset database
npm run seed:dev
```

**Build failures**

```bash
# Clear build cache
npm run perf:cache-clear

# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## License

All Rights Reserved.
