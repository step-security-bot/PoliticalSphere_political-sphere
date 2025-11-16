# Political Sphere

[![Version](https://img.shields.io/badge/version-2.4.0-blue.svg)](CHANGELOG.md)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-in%20progress-yellow)](docs/TODO.md)
[![Coverage](https://codecov.io/gh/political-sphere/political-sphere/branch/main/graph/badge.svg)](https://codecov.io/gh/political-sphere/political-sphere)
[![Audit](https://img.shields.io/badge/audit-completed-green)](#project-status)

Political Sphere is an online multiplayer political simulation platform modeled on the political institutions of the United Kingdom. Players engage in parliamentary-style decision-making: drafting bills, debating policy, forming coalitions, and voting on legislation. Every decision produces realistic simulated outcomes, influencing the virtual country’s economy, public opinion, and social dynamics over time.

Our primary strategic objective is to deliver rich, engaging gameplay that captures the complexity and unpredictability of democratic governance. A secondary strategic objective is to provide civic educational value — not through formal teaching, but through passive exposure to impartial processes and real-world political mechanics. Political Sphere does not promote any ideology or viewpoint; instead, it provides a neutral environment where decisions and consequences speak for themselves.

**AI Integration:**

- **🤖 Development**: AI assistants are used for the vast majority of development tasks — including drafting code, generating documentation, and creating tests. This use of AI is experimental and operates within evolving guardrails that focus on governance, compliance, and security. Because of the experimental nature of AI, unexpected or incorrect outputs may occur, and every AI-generated change is monitored, reviewed, and ultimately approved by a human developer.

The review process prioritises iteration over perfection. At times, code that contains known issues or incomplete logic is intentionally committed to the codebase — not as a final implementation, but as a checkpoint to capture progress and context. These issues are then revisited at the appropriate stage in development, allowing the project to maintain momentum. The sole human developer uses structured prompts to encourage the AI to identify, reflect on, and correct its own mistakes as part of the iterative review process. External validation tools (linters, type checkers, test suites, and security scanners) are used wherever possible to verify AI-generated work.

- **Gameplay**: AI-driven NPCs participate in voting, providing realistic opposition and filling empty parliamentary seats.
- **Governance**: Constitutional framework ensures AI systems cannot manipulate political outcomes or violate democratic principles.

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

## Features

- **Democratic Governance**: Constitutional framework with transparent decision-making and parliamentary procedures
- **Multiplayer Simulation**: Real-time political scenario modeling with up to multiple concurrent players
- **Ethical AI Integration**: AI assistants with strict governance boundaries and constitutional compliance
- **Comprehensive Testing**: Unit, integration, e2e, accessibility, and security testing infrastructure
- **Zero-Trust Security**: End-to-end encryption, auditability, and compliance monitoring
- **Accessibility First**: WCAG 2.2 AA+ compliance across all interfaces with automated testing

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
npm run ai:review        # AI code review and suggestions
npm run ai:blackbox      # Governance compliance checking
npm run ai:status        # Check AI assistant status
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
├── api/                 # REST API server (Express.js + TypeScript)
├── web/                 # React frontend (Vite + TypeScript)
├── game-server/         # Game simulation engine
├── e2e/                 # End-to-end tests
└── infrastructure/      # Infrastructure as Code

libs/                    # Shared libraries and utilities
├── shared/              # Common utilities and types
├── ui/                  # Reusable React components
├── testing/             # Test utilities and factories
└── platform/            # Platform-specific code

docs/                    # Documentation
├── 00-foundation/       # Business and product docs
├── 04-architecture/     # Technical architecture
├── 05-engineering-and-devops/  # Development guides
└── 06-security-and-risk/       # Security documentation

scripts/                 # Automation and utility scripts
.github/                 # GitHub workflows and templates
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

See [Contributing Guide](CONTRIBUTING.md) and [.blackboxrules](.blackboxrules) for governance rules.

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

## Documentation

### Architecture & Design

- [System Architecture](docs/STRUCTURE.md)
- [API Documentation](apps/api/openapi/api.yaml)
- [Database Schema](docs/04-architecture/database-schema.md)
- [Security Guidelines](docs/06-security-and-risk/SECURITY.md)

### Development Guides

- [Contributing Guide](CONTRIBUTING.md)
- [Coding Standards](docs/05-engineering-and-devops/coding-standards-typescript-react.md)
- [Testing Guide](docs/05-engineering-and-devops/testing.md)
- [AI Governance](docs/07-ai-and-simulation/ai-governance.md)

### Project Management

- [TODO List](docs/TODO.md)
- [CHANGELOG](CHANGELOG.md)
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

Political Sphere is built as an Nx monorepo with microservices architecture:

- **Frontend**: React 19 + Vite + TypeScript + WCAG 2.2 AA accessibility
- **Backend**: Express.js + TypeScript + SQLite/PostgreSQL
- **Game Engine**: Custom deterministic simulation with AI NPCs
- **Infrastructure**: Docker + Kubernetes + GitOps deployment
- **Testing**: Vitest + Playwright + axe-core accessibility testing
- **Security**: Zero-trust architecture with comprehensive auditing

## API Overview

- **Base URL**: `http://localhost:3001` (development)
- **Authentication**: JWT with refresh tokens
- **Rate Limiting**: Configurable per endpoint
- **OpenAPI Spec**: [View API Documentation](apps/api/openapi/api.yaml)

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

All Rights Reserved. See [LICENSE](LICENSE) for details.
