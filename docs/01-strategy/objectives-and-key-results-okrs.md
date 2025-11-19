# Objectives and Key Results (OKRs)

> **Short-term goals and success metrics for Political Sphere**

<div align="center">

| Classification | Version | Last Updated |      Owner       | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :--------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-10-30  | Strategy Council |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## 🎯 Overview

Build and validate the core multiplayer parliamentary gameplay loop in a safe, fair, and persistent environment.

**Goal:** End this phase with a playable, testable prototype where players can debate, vote, and experience procedural political play — even if the world is tiny and unpolished.

---

## 🎯 Objective 1: Core Game Mechanics Online

Deliver a functional parliamentary gameplay core.

| Key Results | Success Criteria                                                |
| ----------- | --------------------------------------------------------------- |
| KR1         | Players can log in, select a world, and create a character      |
| KR2         | Basic parliament cycle works: sitting → debate → vote → result  |
| KR3         | Debate queue + speech submission working in real time           |
| KR4         | Voting + tally + publish results system live                    |
| KR5         | Minimal moderation tools available (mute, flag, remove content) |

**Definition of Done:** Two players can simulate a debate and vote in a persistent world, without dev intervention.

---

## 🎯 Objective 2: Persistence, Stability & Fairness

Lay the technical foundation for a trustworthy simulation.

| Key Results | Success Criteria                                   |
| ----------- | -------------------------------------------------- |
| KR1         | PostgreSQL world state + core entities implemented |
| KR2         | Real-time events via WebSockets (debates + votes)  |
| KR3         | Idempotent voting & audit logs for key actions     |
| KR4         | Basic RLS or world-scoped ACLs in place            |
| KR5         | Automated tests covering core political flows      |

**Definition of Done:** Game state never corrupts, double-voting prevented, and actions traceable.

---

## 🎯 Objective 3: Player Safety & Containment

Establish a minimum viable trust & safety layer.

| Key Results | Success Criteria                                        |
| ----------- | ------------------------------------------------------- |
| KR1         | Reporting system live (players can flag speech/actions) |
| KR2         | Manual moderation dashboard working                     |
| KR3         | Guardrails preventing real-world political content      |
| KR4         | Code of Conduct drafted and visible to testers          |

**Definition of Done:** Testers can play safely without drama or real politics creeping in.

---

## 🎯 Objective 4: Basic AI Support (Local)

Introduce ethical, bounded NPC functionality using local models.

| Key Results | Success Criteria                                      |
| ----------- | ----------------------------------------------------- |
| KR1         | Local LLM NPC MPs with rule-based scaffolding         |
| KR2         | NPCs can participate in basic debate or vote behavior |
| KR3         | No real-world political content allowed in AI prompts |
| KR4         | NPC actions logged + explainability stub              |

**Definition of Done:** NPCs fill empty seats & behave within constraints — without ideology.

---

## 🎯 Objective 5: Closed Testing & Feedback Loop

Start tiny-community testing and iteration.

| Key Results | Success Criteria                           |
| ----------- | ------------------------------------------ |
| KR1         | 5–15 private testers onboarded             |
| KR2         | Weekly feedback review, visible to testers |
| KR3         | First gameplay tutorial flow stubbed       |
| KR4         | Publish change notes each sprint           |

**Definition of Done:** A small trusted group can play, give feedback, and see the game improve.

---

## 🔗 Alignment with Vision

| Vision Principle       | OKR Alignment                                     |
| ---------------------- | ------------------------------------------------- |
| Fairness               | No pay advantages, audit logs, idempotent actions |
| Procedural integrity   | Debate & vote mechanics implemented first         |
| Safety & ethics        | Guardrails, moderation, reporting                 |
| Persistence            | Stable world state & progression systems          |
| Thoughtful strategy    | Debate & reputation systems before "flashy"       |
| Zero-budget            | Local stack, incremental build, tiny tester group |
| No real-world politics | Containment systems built early                   |

We're building a serious, credible simulation world, not a Discord role-play server or political playground.

---

## 📊 Success Look-Like (6-month snapshot)

If things are going well, you should be able to say:

You can log in, become an MP, take part in a scheduled debate, deliver a speech, vote on a motion, see results, and your history persists — safely, fairly, and without chaos.

Not flashy — functional, principled, real.

---

## 📋 Related References

- [Product Strategy](product-strategy.md) (Strategic context)
- [Strategic Roadmap](strategic-roadmap-03-12-36-months.md) (Long-term alignment)

OKRs drive focused execution toward Political Sphere's vision of credible, ethical political simulation.
