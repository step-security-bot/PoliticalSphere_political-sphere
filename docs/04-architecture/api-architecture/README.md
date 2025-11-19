# API Architecture

> **Contract strategy for Political Sphere’s GraphQL, REST, and realtime interfaces**

<div align="center">

| Classification | Version | Last Updated |      Owner       | Review Cycle |    Status    |
| :------------: | :-----: | :----------: | :--------------: | :----------: | :----------: |
|  🔒 Internal   | `0.2.0` |  2025-10-30  | Platform Council |  Quarterly   | **Approved** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## 🎯 Goals

- Deliver a cohesive API surface that powers web clients, moderator tooling, educators, and automation.
- Balance developer velocity (Nx monorepo, shared types) with strong contracts (GraphQL schema, OpenAPI specs, contract testing).
- Embed safety, compliance, and audit requirements—especially around AI-powered endpoints and user-generated content.

---

## 🧭 Interface Strategy

| Interface                             | Primary Consumers                                                   | Purpose                                                    | Tooling & Standards                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **GraphQL Gateway**                   | Player web app, moderator console, educator dashboards              | Unified read/write API for UX flows                        | Fastify + Mercurius, schema stitching via modules, persisted queries, auth directives, Apollo Federation-ready |
| **REST / OpenAPI**                    | Internal ops tools, webhooks, admin automations, external partners  | Operational commands, integrations, asynchronous workflows | Fastify controllers, Zod validators, OpenAPI 3.1 specs in repo, codegen for clients                            |
| **Realtime (WebSockets / Socket.IO)** | Debate chambers, vote tallies, media tickers, moderation dashboards | Low-latency updates and collaboration                      | Namespaced channels, JWT handshake, presence & backpressure controls, event contract docs                      |
| **tRPC (Optional)**                   | Internal developer tooling, scripts                                 | Rapid DX for monorepo utilities                            | Scoped to internal apps only; adheres to same auth middlewares                                                 |

---

## 🔐 Cross-Cutting Concerns

- **Authentication & Authorization:** OAuth2/OIDC tokens validated at gateway; GraphQL directives enforce RBAC/ABAC; REST uses scopes + idempotency keys; realtime handshake bound to session + tenant.
- **Rate Limiting & Throttling:** IP + user-level quotas via Redis; stricter limits for write mutations; AI-assisted endpoints protected with additional quotas and abuse detection.
- **Compliance & Audit:** Every mutation creates audit events (append-only); sensitive operations tagged with lawful basis; AI content routes log prompts/responses to Safety Transparency Log.
- **Versioning:** GraphQL uses schema deprecation windows + release notes; REST endpoints URL-versioned (`/v1`); realtime events include semantic version in payload headers.

---

## 📐 Design Guidelines

### GraphQL

- Modular schema: each bounded context exports `typeDefs` + `resolvers` via Nx libs.
- Enforce strict nullability and use input types for commands; mutations return domain payload + `AuditMeta`.
- Subscriptions for debates, votes, moderation queues; use filtered topics to prevent tenant leakage.
- Persisted queries for public clients; short TTL for cache invalidation; use Dataloader for N+1 mitigation.

### REST / Webhooks

- CRUD surfaces reserved for internal automation and admin consoles; prefer GraphQL for UX features.
- All POST/PATCH/DELETE require idempotency keys (`Idempotency-Key` header) and return `202 Accepted` for async workflows.
- Webhooks signed with HMAC, include event schema version, retried with exponential backoff.
- OpenAPI definitions generated via `pnpm run api:generate` and validated in CI with spectral linters.

### Realtime

- Event naming: `context.action.version` (e.g., `debate.speechQueued.v1`).
- Payloads wrap data with metadata (`traceId`, `tenantId`, `schemaVersion`, `issuedAt`).
- Provide ack-based backpressure, heartbeats, resumable sessions, and offline queue for unreliable clients.
- Sensitive events (moderation decisions, AI escalations) require elevated scopes; default to read-only updates for players.

---

## 🧪 Testing & QA

- **Contract Tests:** Pact (REST) and GraphQL schema checks run per Nx affected target; breaking changes fail CI.
- **Integration Suites:** Testcontainers spin up Postgres + Redis for end-to-end API validation; Playwright covers critical user journeys.
- **Security Scans:** ZAP baseline scan, dependency audits, and schema linting integrated into CI; manual pen test of auth-critical endpoints quarterly.
- **Load Testing:** Locust/k6 scenarios for debate broadcasting, voting spikes, and webhook bursts; success criteria align with latency budgets.

---

## 📦 Tooling & Automation

```bash
# Generate GraphQL schema documentation
pnpm run api:graphql:docs

# Validate OpenAPI specs and lint breaking changes
pnpm run api:rest:lint

# Replay realtime event fixtures through regression harness
pnpm run api:realtime:replay --fixture=debate-vote-burst
```

---

## 📎 Related References

- [GraphQL Schema & Conventions](./graphql-schema-and-conventions.md)
- [REST & OpenAPI Specs](./rest-openapi-specs.md)
- [Versioning & Deprecation Policy](./versioning-and-deprecation-policy.md)
- [Observability Architecture](../observability-architecture.md)
- [Security & Risk](../../06-security-and-risk/README.md)

APIs are the contract between Political Sphere’s rich simulation and its users—keep them well-specified, observable, and resilient as the platform evolves.
