/\*\*

- @fileoverview Architecture Documentation for Political Sphere Platform
- @purpose Defines the system architecture, patterns, and design decisions for the Political Sphere development platform.
- @scope Entire platform; applies to all components, services, and infrastructure.
- @lifecycle Active development; updated with architectural changes.
- @owner Architecture Team (architecture@political-sphere.org)
- @version 1.0.0
- @state Active
- @integrity SHA256: [computed hash for traceability]
  \*/

# Architecture Overview

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |    Status    |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :----------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Approved** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## System Architecture

The Political Sphere platform is built as a modern, scalable web application using **microservices architecture** with **domain-driven design** principles. The system is organized as an **Nx monorepo** with clear separation between applications and shared libraries.

### Architecture Context

**Scale**: 12+ deployable applications, 17+ shared libraries  
**Development Model**: Solo developer + AI collaboration  
**Quality Standards**: Enterprise-grade (80%+ test coverage, WCAG 2.2 AA+, zero-trust security)  
**Deployment**: Containerized microservices with Kubernetes orchestration  
**Observability**: Comprehensive logging, metrics, and distributed tracing

### Core Services

#### Frontend Application (`apps/web`)

- **Framework**: React 19 with TypeScript (strict mode)
- **State Management**: Redux Toolkit + RTK Query
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router v6
- **Build Tool**: Vite (fast HMR, optimized production builds)
- **Module Federation**: Webpack Module Federation for micro-frontends
- **Accessibility**: WCAG 2.2 AA+ compliance with axe-core testing

#### Backend API (`apps/api`)

- **Framework**: Node.js 22+ with Fastify (high-performance)
- **Language**: TypeScript with strict type checking
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: JWT with secure refresh token rotation
- **API Specification**: REST + GraphQL with OpenAPI/JSON Schema
- **Validation**: Zod schemas for runtime type safety
- **Caching**: Redis for sessions, queries, and pub/sub

#### Game Simulation Engine (`apps/game-server`)

- **Runtime**: Node.js with TypeScript
- **Real-time**: WebSockets for live game events
- **Simulation**: Custom deterministic simulation engine
- **AI NPCs**: Ollama-powered local AI models
- **Event System**: NATS/Redis pub/sub for game events
- **State Management**: PostgreSQL with transactional consistency

#### Background Workers (`apps/worker`)

- **Framework**: Node.js with BullMQ
- **Queue**: Redis-backed job queues
- **Purpose**: Async processing, scheduled tasks, data aggregation
- **Reliability**: Retry logic, dead-letter queues, monitoring

#### AI Assistant (`tools/scripts/ai/`)

- **Framework**: Node.js with MCP (Model Context Protocol)
- **Purpose**: AI-powered code assistance and automation
- **Features**: Code generation, review, testing, optimization
- **Safety**: Built-in governance and ethical AI constraints
- **Integration**: GitHub Copilot + custom MCP servers

- **Framework**: Node.js with MCP (Model Context Protocol)
- **Purpose**: AI-powered code assistance and automation
- **Features**: Code generation, review, testing, optimization
- **Safety**: Built-in governance and ethical AI constraints

### Infrastructure Components

#### Development Environment (`apps/dev`)

- **Containerization**: Docker Compose for local development
- **Infrastructure as Code**: Terraform for local AWS emulation
- **Monitoring**: Prometheus + Grafana stack
- **Database**: PostgreSQL + Redis
- **Identity**: Keycloak for authentication

#### Production Infrastructure (`libs/infrastructure`)

- **Cloud Provider**: AWS
- **Container Orchestration**: ECS Fargate
- **Load Balancing**: Application Load Balancer with WAF
- **Database**: Aurora PostgreSQL
- **Caching**: ElastiCache Redis
- **CDN**: CloudFront
- **Secrets Management**: AWS Secrets Manager

### Shared Libraries

#### Platform Library (`libs/platform`)

- **Purpose**: Common business logic and utilities
- **Modules**: Authentication, authorization, data validation
- **Framework**: Pure TypeScript/JavaScript

#### Shared UI Library (`libs/ui`)

- **Purpose**: Reusable UI components
- **Framework**: React with Storybook
- **Design System**: Consistent styling and theming

#### CI/CD Library (`libs/ci`)

- **Purpose**: Shared CI/CD configurations and scripts
- **Tools**: GitHub Actions, Nx workflows

## Architecture Patterns

### Microservices Architecture

- **Service Boundaries**: Clear separation of concerns
- **API Gateway**: Centralized entry point for all services
- **Service Discovery**: Automatic service registration and discovery
- **Circuit Breakers**: Fault tolerance and resilience

### Module Federation

- **Purpose**: Enable micro-frontends and shared modules
- **Benefits**: Independent deployment, code sharing, scalability
- **Implementation**: Webpack Module Federation

### Infrastructure as Code

- **Tool**: Terraform
- **Benefits**: Version-controlled infrastructure, reproducibility
- **Environments**: dev, staging, production with consistent setup

### Observability

- **Metrics**: Prometheus for system and application metrics
- **Visualization**: Grafana dashboards
- **Logging**: Centralized logging with correlation IDs
- **Tracing**: Distributed tracing for request flows

## Data Architecture

### Database Design

- **Primary Database**: PostgreSQL with Aurora for production
- **Schema**: Normalized relational design
- **Migrations**: Prisma for schema management
- **Backup**: Automated backups with point-in-time recovery

### Caching Strategy

- **Session Store**: Redis for user sessions
- **Data Cache**: Redis for frequently accessed data
- **CDN**: CloudFront for static assets

### Data Flow

1. **Ingestion**: API receives requests
2. **Validation**: Input validation and sanitization
3. **Processing**: Business logic execution
4. **Storage**: Data persistence to database
5. **Caching**: Update cache layers
6. **Response**: Formatted response to client

## Security Architecture

### Authentication & Authorization

- **Identity Provider**: Keycloak for OAuth2/OIDC
- **Token Management**: JWT with refresh token rotation
- **Role-Based Access Control**: Hierarchical permissions
- **Multi-Factor Authentication**: Optional 2FA

### Network Security

- **Web Application Firewall**: AWS WAF with OWASP rules
- **SSL/TLS**: End-to-end encryption
- **Network Segmentation**: VPC with security groups
- **Secrets Management**: AWS Secrets Manager with rotation

### Application Security

- **Input Validation**: Comprehensive validation and sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Anti-CSRF tokens

## Deployment Architecture

### CI/CD Pipeline

- **Version Control**: Git with conventional commits
- **Build**: Nx for monorepo builds
- **Test**: Automated testing with coverage reporting
- **Security**: SAST, DAST, and dependency scanning
- **Deploy**: Blue-green deployments with health checks

### Environment Strategy

- **Development**: Local development with Docker
- **Staging**: Mirror of production environment
- **Production**: Highly available, multi-AZ deployment

### Scaling Strategy

- **Horizontal Scaling**: ECS tasks scale based on CPU/memory
- **Database Scaling**: Aurora read replicas
- **Caching**: ElastiCache cluster mode
- **CDN**: Global content delivery

## Performance Considerations

### Frontend Optimization

- **Code Splitting**: Dynamic imports and lazy loading
- **Bundle Optimization**: Tree shaking and minification
- **Caching**: Service worker for offline capability
- **CDN**: Global asset delivery

### Backend Optimization

- **Database Indexing**: Optimized queries and indexes
- **Caching Layers**: Multi-level caching strategy
- **Async Processing**: Background job processing
- **Connection Pooling**: Efficient database connections

### Monitoring & Alerting

- **System Metrics**: CPU, memory, disk usage
- **Application Metrics**: Response times, error rates
- **Business Metrics**: User engagement, conversion rates
- **Alerting**: Proactive issue detection and notification

## Compliance & Governance

### Data Privacy

- **GDPR Compliance**: Data minimization and consent management
- **CCPA Compliance**: Privacy rights and data portability
- **Audit Logging**: Comprehensive audit trails

### Ethical AI

- **Bias Mitigation**: Regular bias audits and monitoring
- **Transparency**: Explainable AI decisions
- **Governance**: AI usage policies and oversight

### Content Moderation

- **Automated Filtering**: AI-powered content analysis
- **Human Oversight**: Escalation for complex cases
- **Reporting**: Transparency in moderation decisions

This architecture provides a solid foundation for a scalable, secure, and maintainable political discourse platform while ensuring high performance and user experience.
