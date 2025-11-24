# REST & OpenAPI Specs

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.
> **Operational interfaces and documentation standards for RESTful surfaces**

---

## 🧭 Scope

- Admin and moderator operations (`/admin/*`)
- Webhooks for external integrations (`/webhooks/*`)
- Ops tooling (`/ops/*`) including audit exports, feature flag toggles, environment automation

GraphQL remains the primary player-facing interface; REST focuses on operational and integration workflows.

---

## 🧱 Standards

- **Specification Format:** OpenAPI 3.1 (YAML) stored in `apps/api-gateway/openapi/*.yaml`.
- **Generation:** Schemas generated via `pnpm run api:rest:generate`; Typescript clients emitted with `openapi-typescript`.
- **Validation:** Spectral linting in CI; breaking changes flagged via `pnpm run api:rest:diff`.
- **Documentation:** Rendered with Redocly and published under `/docs/api/rest`.

---

## 🔐 Requirements

- OAuth2 scopes enforce least privilege (`admin:read`, `admin:write`, `ops:audit`, `ops:feature-flags`).
- All mutating endpoints require idempotency headers and return `202` when async.
- Webhooks signed via HMAC-SHA256; rotate secrets quarterly; include `X-Public-Key-Id` header for key lookup.
- Payload schemas reference shared components (`ErrorResponse`, `Pagination`, `AuditMeta`).

---

## 🧪 Testing

- Contract tests using Pact + in-memory Fastify server.
- Integration suites via Supertest + Testcontainers for DB interactions.
- Security scanning with OWASP ZAP baseline; manual pen test of critical endpoints.

---

## 📎 Key Endpoints (MVP)

| Path                                | Description                          | Notes                                                  |
| ----------------------------------- | ------------------------------------ | ------------------------------------------------------ |
| `POST /admin/worlds`                | Provision new simulation world       | Async; triggers Terraform/Tilt pipeline (future)       |
| `PATCH /admin/feature-flags/{flag}` | Toggle runtime feature flag          | Audit logged, dual-auth if `high_risk`                 |
| `POST /webhooks/moderation`         | Receive moderation escalation events | Supports retries, exponential backoff                  |
| `GET /ops/audit-logs`               | Export signed audit trail            | Requires `ops:audit` scope; supports cursor pagination |

Keep specs reviewed during release planning; link updates to ADRs and change logs for traceability.
