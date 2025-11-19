# Platform Strategy: Multiplayer Simulation

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Overview

Political Sphere's platform strategy emphasizes a modular monolith architecture for reliability, server-authoritative gameplay for trust, and ethical AI integration. The focus is on persistent, fair multiplayer worlds with zero-budget scalability.

## Technical Architecture Principles

### 1. Modular Monolith First

- Single codebase with logical modules (domains).
- Avoid microservices until player scale demands it.
- Nx workspace structure with shared packages.
- **Why:** Faster dev, higher reliability, easier enforcement of rules and audit.

### 2. Deterministic, Server-Authoritative World

- All gameplay logic runs server-side.
- Client = renderer, not authority.
- No trust in the client for outcomes.
- **Why:** Politics is legitimacy — trust the server.

### 3. REST + WebSockets

- REST for writes/queries.
- WebSockets for debate events, votes, presence.
- **Why:** Simple, free, stable, fits zero-budget constraints.

### 4. PostgreSQL with Row-Level Security

- tenant_id for world isolation.
- Stored procedures for sensitive logic.
- FTS for search (avoid Elasticsearch costs).
- **Why:** Cheap, powerful, audit-friendly.

### 5. Local AI, Guardrailed

- NPC MPs + moderation helper via Ollama.
- JSON schema constraints.
- Logged outputs for review.
- **Why:** Zero cloud cost, ethical boundaries.

### 6. Event-Driven Internal Architecture

- Event bus (Redis pub/sub or in-process event dispatcher).
- Outbox pattern to avoid lost events.
- Events: debate.started, speech.posted, vote.cast, division.closed, etc.
- **Why:** Traceability, scalability later, low-cost now.

### 7. Observability from Day 1

- Minimal but real: Request logs w/ correlation IDs, audit log table for sensitive actions, error telemetry (open-source or local).
- **Why:** Persistent worlds need visibility.

## Scalability Strategy

Scale in stages — no big-bang cloud.

### Phase 1: Local & Small-Group Play

- Docker + local.
- 5–30 players.
- **Infrastructure:** Local dev environment.

### Phase 2: Single VPS

- Cheap container host (Fly.io free tier / low-cost VPS).
- Horizontal scaling not required yet.
- Backup & restore scripts.

### Phase 3: Tiered Worlds

- Multiple world instances (shards).
- Player communities self-sort.
- Clear migration paths, archive worlds.
- **Key:** Scaling by world segmentation, not giant shared servers.

## User Experience Strategy

### Predictable Parliamentary Flow

- Players need a sense of order and ceremony: agenda → debate → vote → result.
- Speaking queues, countdown timers, visible process status.
- Makes the world feel serious & structured, not chaotic.

### Hybrid Interaction Model

- Real-time speeches and events.
- Asynchronous participation windows (for global players & casual pacing).
- Notification and scheduling support.
- **Why:** Politics isn’t a Twitch shooter — it's a calendar-driven world.

### Onboarding Without Dumbing Down

- New player induction / “clerk briefing”.
- Training chamber optional.
- Guided first-debate missions.
- No lore dumps, show systems through doing.
- **Tone:** Calm, principled, transparent.

### Reputation = UX Feedback

- Political power flows from visible reputation signals: Voting record, debate history, behaviour & sanctions.
- Reputation = the real currency.

### Accessibility

- Keyboard navigation, screen reader friendly, colour-safe palette & contrast.
- Even with limited budget — principle, not marketing.

## Safety & Governance Layer

Political simulation without toxicity guardrails = disaster.

### Platform Strategy Bakes In:

- No real-world political mobilisation.
- Respectful tone systems.
- Reporting + appeals.
- NPCs never do ideology.
- Content filters for harassment.
- Privacy protections (pseudonymity default).

This is a political world without real-world harm.

## Long-Term Strategic Horizon

Once core loops proven:

- Formal simulation APIs for automation/agents.
- World archives & “eras”.
- Procedural story generators for political cycles.
- Election seasons as content arcs.
- Player-led committees & inter-party negotiations.

But ONLY when core is rock-solid.
