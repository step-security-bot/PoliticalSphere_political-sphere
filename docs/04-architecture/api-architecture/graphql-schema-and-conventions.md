# GraphQL Schema & Conventions

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.
> **Design rules for Political Sphere's GraphQL gateway**

---

## 🎯 Goals

- Provide a consistent API surface for player-facing experiences.
- Make schemas self-documenting, versionable, and compliant with governance controls.
- Support realtime subscriptions for debates, votes, and moderation while maintaining safety boundaries.

---

## 🧱 Schema Structure

- **Modular SDL:** Each bounded context exports SDL and resolvers from `libs/api/<context>`.
- **Namespace by Type:** Use prefixes sparingly; rely on categories (`ParliamentMotion`, `DebateSpeech`) mirroring domain language.
- **Input Types:** All mutations accept dedicated `Input` objects (no scalar arguments) to ease evolution.
- **Payload Envelope:** Mutations return `Payload` containing `record`, `errors`, and `auditMeta`.
- **Interfaces & Unions:** Model polymorphism for NPC/human actors (`Actor` interface) and media entries.

---

## 🔐 Auth & Tenancy

- `@requireRole(role: Role!)` directive enforces RBAC/ABAC.
- `@tenantScoped` directive injects `worldId` filter automatically.
- Field-level masking for sensitive data (`@redactPII`) ensuring compliance with GDPR/Online Safety.

---

## 🔔 Subscriptions

- Topics map to domain events (`parliament.divisionRecorded.v1`).
- Subscription resolvers filter by tenant and authorisation before fan-out.
- Backpressure handled via async iterators with timeouts; clients required to ack.

---

## 🧪 Testing & Tooling

- Schema generated via `pnpm run api:graphql:schema`.
- `graphql-inspector` runs in CI to detect breaking changes; approvals required for incompatible diffs.
- Snapshot docs generated and published to `docs/api.md`.
- Contract tests (Pact) ensure frontends and moderation tools validated against schema.

Keep schema docs aligned with ADRs and API release notes to maintain reliable integrations.
