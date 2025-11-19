# Data Lifecycle & Backups

> **Retention, archival, and recovery guardrails for Political Sphere data**

<div align="center">

| Classification | Version | Last Updated |      Owner       | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :--------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-10-30  | Data Stewardship |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## 🔄 Data Lifecycle Stages

| Stage          | Description                                                            | Responsible Contexts             | Controls                                                           |
| -------------- | ---------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------ |
| **Creation**   | Data enters system via user interaction, AI generation, imports        | All                              | Classification tags, lawful basis capture, validation              |
| **Active Use** | Data drives gameplay, analytics, moderation                            | Domain owners                    | Access control, retention timers, PII minimisation                 |
| **Archival**   | Data no longer needed day-to-day but retained for legal/audit purposes | Data Stewardship                 | Move to cold storage buckets or archive schema, encrypt + checksum |
| **Deletion**   | Data removed after retention window or DSAR                            | Platform Council & Domain owners | Automated deletion jobs, audit of deletions, legal hold bypass     |

Retention schedules live in [Retention & Archiving Policy](../../document-control/retention-and-archiving-policy.md); this doc operationalises those rules.

---

## 💾 Backup Strategy

| Store              | Backup Frequency                                                             | Retention                                       | Restoration Goals                        |
| ------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| **PostgreSQL**     | Continuous PITR (WAL archiving) + daily full snapshot                        | 30 days online, 365 days cold archive           | RPO ≤ 5 min, RTO ≤ 1 hr                  |
| **Redis**          | Hourly RDB snapshot for queues; no persistence for ephemeral cache           | 24 hours                                        | RPO 1 hr for persistent data, RTO 30 min |
| **Object Storage** | Versioning enabled, lifecycle policies to Glacier-equivalent after retention | 7 years (evidence, audit), 1 year (transcripts) | RPO 1 hr, RTO 2 hrs                      |
| **Audit Log**      | Redundant append-only replicas + daily signed digest stored offsite          | 7 years minimum                                 | RPO 0 (synchronous), RTO 1 hr            |

Backups encrypted with KMS-managed keys; access restricted to Security/Platform via break-glass approvals.

---

## 🛠️ Recovery Procedures

1. **Incident Declaration:** Trigger runbook from [Disaster Recovery Plan](../../DISASTER-RECOVERY-RUNBOOK.md); assign incident commander.
2. **Assess Scope:** Identify affected contexts, data stores, and time window; consult telemetry and audit logs.
3. **Restore Sequence:**
   - PostgreSQL from PITR or snapshot.
   - Redis queues if required (snapshot restore).
   - Object storage rehydrate critical buckets.
   - Replay domain events if necessary to rebuild projections.
4. **Validation:** Run automated data integrity checks (checksums, record counts, referential integrity) and manual smoke tests for critical flows.
5. **Post-Restore Actions:** Document in incident postmortem, update recovery metrics, adjust runbooks.

---

## 🧾 DSAR & Right-to-Be-Forgotten Workflow

- Request logged in privacy ticket queue with SLA (30 days).
- Data catalog identifies relevant tables/objects via PII tags.
- Soft-delete flagged records; asynchronous job performs hard delete after retention checks.
- Audit event recorded with anonymised actor reference.
- Confirm completion with requestor and log outcome in DSAR register.

---

## 🔍 Monitoring & Alerts

- Backup jobs emit metrics (`backup_duration`, `backup_success`) with alerts on failure or duration anomalies.
- Restore drills executed semi-annually; results tracked in compliance dashboard.
- Data drift detection between production and read replicas; alert on divergence.

Maintain lifecycle docs alongside policy changes, new contexts, or infra upgrades to guarantee resilience and compliance.
