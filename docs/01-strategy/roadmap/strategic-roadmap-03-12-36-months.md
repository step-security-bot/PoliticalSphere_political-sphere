# Strategic Roadmap (3-12-36 Months)

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Overview

This roadmap outlines the phased development and growth of Political Sphere, focusing on building a minimal viable product (MVP) that proves the core simulation works, then scaling to a sustainable, ethical multiplayer world. Priorities emphasize integrity, fairness, and persistence over flashy features.

## Phase 1: Foundation & MVP (0-3 Months)

### Objectives

- Establish the minimal but solid platform to prove the simulation works.
- Create a small, fully functional closed test world.
- Prioritise integrity over features — fairness, persistence, stability, security.

### Key Milestones

- **Infrastructure:** Local dev environment, Docker setup, database schema, REST + WebSocket baseline.
- **Core Systems:** Player accounts, auth, role types (MP, Speaker, Admin).
- **Gameplay Loop:** Create → debate → vote → record result.
- **Persistence:** PostgreSQL RLS world data model stable.
- **Moderation:** Basic flagging/reporting + manual dashboard.
- **AI:** Local model integration (Ollama) for NPC speeches & summaries.
- **Docs & Governance:** Foundation docs complete (Core Values, Business Model, Security, Roadmap).

### Priorities

- Build for reliability & fairness, not speed.
- Keep costs at £0.
- Focus on one playable world with testable parliamentary flow.

### Success Metrics

- 1 functional persistent world (no resets needed).
- 5–15 active testers.
- <1 critical bug per week.
- 100% core events logged (votes, debates, outcomes).
- Positive fairness & clarity feedback from testers.

## Phase 2: Closed Beta & World Expansion (3-12 Months)

### Objectives

- Transition from prototype to public-ready closed beta.
- Build robust systems for moderation, reputation, and progression.
- Strengthen UX and trust infrastructure.

### Key Milestones

- **Gameplay:** Full parliamentary cycle: sessions, debates, amendments, votes, results, and archives.
- **Reputation & Parties:** Party creation, leadership, whip system, reputation scoring.
- **AI & NPCs:** NPCs for quorum + procedural support; AI moderation assistant with transparency logs.
- **Safety:** Appeals + review process, full audit trail.
- **Persistence & Scaling:** Multi-world support (world segmentation).
- **UX:** Improved onboarding, tutorial, session schedules, visual feedback.
- **Business Model:** Subscription system implemented (single-tier), optional free trial.
- **Community Tools:** Private Discord or forum integration (optional, moderated).
- **Docs & Policy:** Player Safety Charter, Moderation Framework, Subscription Policy.

### Priorities

- Deliver a full “session cycle” experience.
- Prepare ethical, safe testing community.
- Establish gameplay trust — procedural clarity, no bias.

### Success Metrics

- 100+ registered testers.
- 80%+ report clarity in rules and fairness.
- 95% uptime during sessions.
- Retention: ≥ 60% of testers active weekly.
- Subscription ready but optional during beta.

## Phase 3: Growth & Refinement (12-36 Months)

### Objectives

- Move from beta to sustainable, ongoing live simulation.
- Build long-term player retention loops, community culture, and ethical scalability.
- Develop archival, narrative, and seasonal systems.

### Key Milestones

- **Governance:** Player-elected Speaker, formalised procedural constitution.
- **Elections & History:** World seasons, election cycles, persistent archives.
- **Content:** Scenarios, amendments, party manifestos, NPC campaigns.
- **AI Evolution:** Advanced local NPC reasoning; committee simulation; narrative summaries.
- **Community Governance:** Volunteer moderation corps, structured appeals, transparent decision logs.
- **Internationalization:** i18n foundation complete; community-led translations (EN → DE/FR).
- **Scaling & Infra:** Multiple concurrent worlds; automated backups; telemetry dashboards.
- **Sustainability:** Stable subscription base (modest, low-cost hosting covered by subs).

### Priorities

- Maintain fairness, ethical containment, and world stability.
- Grow deliberately — quality > quantity.
- Institutionalize transparency: changelogs, policies, and moderation accountability.

### Success Metrics

- **Community:** 1,000+ active monthly players.
- **Stability:** 99.5% uptime, <0.1% rollback rate.
- **Fairness:** <2% successful moderation appeals (indicating consistency).
- **Retention:** 60%+ active retention after 90 days.
- **Reputation:** Players trust procedural systems (survey ≥85% positive).
- **Financial:** Sustainable revenue (break-even; £0 infra spend met by subs).
- **Ethical Health:** 0 incidents of real-world political influence.

## Strategic Alignment Table

| Long-Term Pillar | 3–12–36 Month Alignment                                                              |
| ---------------- | ------------------------------------------------------------------------------------ |
| Fairness         | 3m: procedural enforcement → 12m: reputation fairness → 36m: governance codification |
| Persistence      | 3m: stable DB → 12m: world saves → 36m: world history + archives                     |
| Safety           | 3m: flag/report → 12m: appeals → 36m: community-led moderation                       |
| Ethics           | 3m: no real-world politics → 12m: containment checks → 36m: policy audits            |
| Scalability      | 3m: single world → 12m: multi-world → 36m: autonomous worlds                         |
| Accessibility    | 3m: keyboard nav → 12m: full onboarding → 36m: i18n + assistive design               |

## High-Level Narrative

- **0–3 months:** Build the floor. Get one chamber working. Test trust and fairness.
- **3–12 months:** Open the doors. Invite the first parliament. Measure, refine, and prove the world can sustain order and engagement.
- **12–36 months:** Institutionalize. Add elections, seasons, archives, and world history. Achieve ethical, self-sustaining political simulation at scale.

## Rolling OKR Snapshot

- **Objective:** Playable prototype operational → **KR:** 2-player functional test world live → **Timeframe:** 3 months.
- **Objective:** Closed beta stability → **KR:** 95% uptime, <10 bugs/month → **Timeframe:** 6 months.
- **Objective:** Procedural parliament simulation → **KR:** Debates → votes → results loop complete → **Timeframe:** 9 months.
- **Objective:** Safe moderated world → **KR:** <3 unresolved reports per week → **Timeframe:** 12 months.
- **Objective:** Multi-world scalability → **KR:** 3 simultaneous worlds → **Timeframe:** 24 months.
- **Objective:** Ethical self-governance achieved → **KR:** Player-elected Speaker, transparent moderation → **Timeframe:** 36 months.
