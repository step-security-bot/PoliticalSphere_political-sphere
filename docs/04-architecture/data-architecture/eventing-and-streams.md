# Eventing & Streams

> **Domain event contracts and streaming architecture for Political Sphere**

<div align="center">

| Classification | Version | Last Updated |      Owner       | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :--------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-10-30  | Platform Council |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## 🎯 Objectives

- Decouple bounded contexts, AI orchestration, and analytics through reliable event streams.
- Provide clear contracts, schemas, and governance for domain events.
- Enable observability and replay for debugging, audits, and simulation tuning.

---

## 🧱 Event Platform

| Component                    | Purpose                                               | Notes                                               |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| **NATS JetStream**           | Primary event bus for domain events                   | At-least-once delivery, ordered streams per subject |
| **Redis Streams (Fallback)** | Low-latency transient events (realtime presence)      | Used for debate presence/typing indicators          |
| **Kafka (Future)**           | High-throughput analytics and long-term event storage | Evaluate when load >50k events/sec sustained        |

## 🔔 Key Event Streams

| Subject                | Producer            | Consumers                                      | Purpose                          |
| ---------------------- | ------------------- | ---------------------------------------------- | -------------------------------- |
| `debate.started`       | Parliamentary Core  | Realtime gateway, Media, AI agents             | Begin debate workflow            |
| `debate.ended`         | Parliamentary Core  | Realtime gateway, Media, Analytics             | End debate, log transcript       |
| `vote.division_opened` | Parliamentary Core  | Realtime gateway, AI agents                    | Start vote collection            |
| `vote.cast`            | Parliamentary Core  | Realtime gateway, Moderation, Analytics        | Record individual vote           |
| `vote.division_closed` | Parliamentary Core  | Realtime gateway, Media, AI                    | Finalize tally, broadcast result |
| `moderation.flagged`   | Safety & Moderation | Admin console, Audit log, Notification service | Alert moderators, track appeals  |

---

## 🧾 Event Contract Standards

- Naming: `context.entity.eventName.v1` (e.g., `parliament.motionScheduled.v1`).
- Schema: Zod definitions stored in `libs/events/<context>` and published to registry.
- Envelope:
  ```ts
  type EventEnvelope<T> = {
    id: string;
    schemaVersion: string;
    occurredAt: string;
    emittedBy: string;
    tenantId: string;
    traceId: string;
    payload: T;
    metadata?: Record<string, unknown>;
  };
  ```
- Idempotency: Consumers enforce idempotency via event `id`; producers guarantee monotonic ordering per aggregate.
- Security: JWT-based publisher auth; sensitive payload fields encrypted when necessary (e.g., moderation evidence).

---

## 🔔 Key Event Streams

| Subject                         | Producer                   | Consumers                                      | Purpose                                                 |
| ------------------------------- | -------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `debate.started`                | Parliamentary Core         | Realtime gateway, Media, AI agents             | Begin debate workflow                                   |
| `debate.ended`                  | Parliamentary Core         | Realtime gateway, Media, Analytics             | End debate, log transcript                              |
| `vote.division_opened`          | Parliamentary Core         | Realtime gateway, AI agents                    | Start vote collection                                   |
| `vote.cast`                     | Parliamentary Core         | Realtime gateway, Moderation, Analytics        | Record individual vote                                  |
| `vote.division_closed`          | Parliamentary Core         | Realtime gateway, Media, AI                    | Finalize tally, broadcast result                        |
| `moderation.flagged`            | Safety & Moderation        | Admin console, Audit log, Notification service | Alert moderators, track appeals                         |
| `parliament.motionScheduled.*`  | Parliamentary Core         | Debate context, Media narrative, AI agents     | Begin debate scheduling workflow                        |
| `parliament.divisionRecorded.*` | Parliamentary Core         | Media, AI, Analytics                           | Update vote tallies, trigger news briefs                |
| `debate.speechPublished.*`      | Debate & Chambers          | Realtime gateway, Media, Moderation            | Broadcast speech, transcript logging, safety review     |
| `election.resultsFinalised.*`   | Elections & Constituencies | Player profiles, Media, AI                     | Update MP assignments, generate sentiment reports       |
| `safety.reportEscalated.*`      | Safety & Moderation        | Admin console, Audit log, Notification service | Alert moderators, track appeals                         |
| `ai.agentDecisionLogged.*`      | AI Simulation              | Safety transparency log, Evaluation harness    | Provide AI accountability trail                         |
| `iam.userDeactivated.*`         | IAM                        | All contexts                                   | Enforce revocation, cleanup sessions, notify moderators |

---

## 🔄 Replay & Observability

- **Event Store:** JetStream streams retain events for 90 days; snapshots exported to object storage monthly for audit continuity.
- **Replay Tooling:** `pnpm run events:replay --subject=parliament.divisionRecorded --from=2025-01-01` replays events into staging for debugging or AI re-evaluation.
- **Tracing:** `traceId` propagated from HTTP/WebSocket requests; telemetry ties events to user actions and AI decisions.
- **Metrics:** Publish `event_lag_seconds`, `consumer_backlog`, `delivery_failures`; alerts configured when lag >5 s or failure rate >0.1%.

---

## 📎 Governance

- Event versioning documented in [Versioning & Deprecation Policy](../api-architecture/versioning-and-deprecation-policy.md).
- New events require ADR or RFC referencing domain intent, schema, and consumers.
- Breaking changes follow announce → dual-write → consumers migrate → retire cadence.

Eventing is the nervous system of Political Sphere—keep contracts explicit, observable, and well-governed.
