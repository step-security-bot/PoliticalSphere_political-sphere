# Data Architecture

> **Governed data strategy for Political Sphere’s simulation, compliance, and analytics**

<div align="center">

| Classification | Version | Last Updated |      Owner       | Review Cycle |    Status    |
| :------------: | :-----: | :----------: | :--------------: | :----------: | :----------: |
|  🔒 Internal   | `0.2.0` |  2025-10-30  | Data Stewardship |  Quarterly   | **Approved** |

</div>

---

## 🎯 Objectives

- Support rich parliamentary simulation while enforcing privacy, safety, and audit requirements.
- Maintain clear ownership and tenancy boundaries per bounded context.
- Instrument data flows for transparency, retention, and legal defensibility.

> NOTE: Data architecture decisions must follow the overall project context (mission, legal constraints, AI usage) — see `docs/00-foundation/project-context.md` for strategic direction and compliance expectations.

---

## 🧱 Storage Stack

| Store                              | Purpose                                                                                                                           | Deployment Notes                                                   | Compliance Hooks                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **PostgreSQL**                     | System of record for domain aggregates (User, PlayerProfile, Bill, Motion, Debate, Vote, Election, MediaItem, Report, AuditEvent) | Managed Postgres, PITR enabled, read replicas optional             | Row-level tenancy or schema-per-world (ADR TBD), soft deletes, audit triggers |
| **Redis**                          | Caching, rate limiting, message queues, realtime presence                                                                         | Dedicated cluster with persistence for queues, ephemeral for cache | Key tagging for purge/retention, namespacing per tenant                       |
| **Object Storage (S3-compatible)** | Media uploads, transcript exports, evidence bundles, AI prompt logs                                                               | Versioned buckets, encryption at rest (SSE-KMS), lifecycle rules   | Retention policies per classification, secure links w/ expiry                 |
| **Secure Audit Log**               | Immutable record of sensitive operations                                                                                          | Append-only store with signing/verification                        | Required for ISO, GDPR accountability, safety transparency                    |
| **Analytics Warehouse (Future)**   | Aggregated insights, experimentation metrics                                                                                      | Evaluate BigQuery/Snowflake once data volume warrants              | Pseudonymisation, differential privacy (roadmap)                              |

---

## 🧭 Tenancy Strategy

- **Primary Approach (MVP):** Row-level tenancy with `world_id` on all shared tables; enforced through Prisma middleware and database RLS policies.
- **Alternate Path (Post-MVP):** Schema-per-world for large institutional customers; requires automated provisioning, migrations, and reporting aggregation.
- **Data Access Layer:** All reads/writes funnel through context-specific repositories to centralise tenancy enforcement and auditing.

---

## 🔐 Governance & Compliance

- **PII Catalog:** Email, handle, IP, session identifiers, payment details (if applicable), user-generated content tagged with data classification, lawful basis, and retention schedule.
- **Retention & Deletion:** Soft deletes default; periodic archival jobs enforce retention matrix (see [Retention Policy](../../document-control/retention-and-archiving-policy.md)).
- **Auditability:** Audit events include `actor`, `action`, `resource`, `before/after`, `traceId`; stored in append-only log with periodic sealing.
- **DPIA Integration:** Data flows documented per feature; high-risk processing reviewed with Data Protection Officer.

---

## 📚 Related Documents

- [Data Models & ERD](./data-models-and-erd.md)
- [Data Lifecycle & Backups](./data-lifecycle-and-backups.md)
- [Eventing & Streams](./eventing-and-streams.md)
- [PII Classification & Tokenization](./pii-classification-and-tokenization.md)
- [Security & Risk](../../06-security-and-risk/README.md)

Keep this data architecture current with schema changes, DPIA updates, and new bounded contexts to guarantee compliance and observability.
