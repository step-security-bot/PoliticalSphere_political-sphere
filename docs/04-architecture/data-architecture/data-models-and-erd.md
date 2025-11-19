# Data Models & ERD

> **Authoritative catalogue of core aggregates powering Political Sphere**

<div align="center">

| Classification | Version | Last Updated |      Owner       | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :--------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-10-30  | Data Stewardship |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Conventions (apply to all tables)

- `id UUID` (v7 preferred), `tenant_id UUID` (world), `created_at`, `updated_at`, `deleted_at NULL`, `version INT`.
- Actor stamps on writes: `created_by`, `updated_by` (nullable for system jobs).
- RLS: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.
- Index pattern: `(tenant_id, <foreign key>)`, plus functional indexes for lookups and FTS.

## 1) Tenancy & Configuration

**world**
World (game shard / tenant).

- `id`, `name`, `status {active, archived}`, `settings JSONB`, `starts_on`, `ends_on?`

**feature_flag**
Toggleable runtime features per world.

- `id`, `key`, `enabled BOOL`, `scope {world, global}`, `world_id?`

## 2) Identity & Access (IAM)

**user** _(PII kept minimal)_

- `id`, `email (unique)`, `handle (unique per world)`, `password_hash`, `mfa_enabled BOOL`

**session**

- `id`, `user_id`, `ip_hash`, `user_agent`, `expires_at`, `revoked_at?`

**role_assignment**
Per-world roles.

- `id`, `user_id`, `world_id`, `role {PLAYER, MODERATOR, ADMIN}` (unique `(user_id, world_id, role)`)

**permission_override** _(optional/rare)_

- `id`, `user_id`, `world_id`, `policy JSONB` (ABAC exceptions with audit)

**user_profile** _(separate PII)_

- `user_id`, `display_name`, `avatar_ref?`, `bio?` _(tag PII: contact/profile)_

## 3) Player, Parties, Representation

**player_profile**
A user's in-world persona.

- `id`, `world_id`, `user_id`, `reputation INT DEFAULT 0`, `titles JSONB`, `badges JSONB`

**party**

- `id`, `world_id`, `name UNIQUE(world)`, `abbrev`, `colour`, `standing_orders JSONB`, `whip_policy JSONB`

**party_membership**

- `id`, `world_id`, `party_id`, `player_id`, `role {MEMBER, WHIP, LEADER, DEPUTY}` (unique `(player_id, party_id)`)

**constituency**

- `id`, `world_id`, `name UNIQUE(world)`, `electorate INT`, `region`, `meta JSONB`

**mp**
Seat holder; can be **player-controlled** or **NPC**.

- `id`, `world_id`, `constituency_id`, `party_id`, `player_id?`, `npc_agent_id?`, `status {SITTING, VACANT}`

_(Constraint: exactly one of `player_id` or `npc_agent_id` is set.)_

## 4) Parliamentary Process (Core Gameplay)

**session_parliamentary**

- `id`, `world_id`, `label`, `starts_on`, `ends_on?`

**sitting_day**

- `id`, `world_id`, `session_id`, `date`, `chamber {COMMONS}`

**order_paper_item**
Agenda entries.

- `id`, `world_id`, `sitting_day_id`, `kind {MOTION, BILL_STAGE, URGENT_Q}`, `ref_id`, `position INT`

**bill**

- `id`, `world_id`, `title`, `short_title`, `sponsor_mp_id`, `text_ref` (doc storage key), `status {DRAFT, IN_PROGRESS, PASSED, FAILED}`

**bill_stage**

- `id`, `world_id`, `bill_id`, `stage {FIRST_READING, SECOND_READING, COMMITTEE, REPORT, THIRD_READING}`, `started_at`, `ended_at?`

**motion**
Standalone or bill-related motion.

- `id`, `world_id`, `title`, `text`, `mover_mp_id`, `related_bill_id?`

**amendment**

- `id`, `world_id`, `motion_id OR bill_id`, `proposer_mp_id`, `text`, `status {TABLED, SELECTED, REJECTED, ADOPTED}`

**debate**

- `id`, `world_id`, `topic`, `order_paper_item_id`, `state {QUEUED, LIVE, SUSPENDED, ADJOURNED, CLOSED}`, `started_at?`, `ended_at?`

**speech**

- `id`, `world_id`, `debate_id`, `speaker_mp_id`, `position_in_queue`, `content_ref` (transcript), `posted_at`

**division**
A recorded vote.

- `id`, `world_id`, `motion_id OR bill_stage_id`, `opened_at`, `closed_at?`, `result {PENDING, AYE, NO, TIED, NO_QUORUM}`, `teller_ids JSONB?`

**vote**

- `id`, `world_id`, `division_id`, `voter_mp_id`, `choice {AYE, NO, ABSTAIN}`, `whip_pressure INT`, `rationale_text?`, `idempotency_key UUID`

**hansard_transcript**

- `id`, `world_id`, `debate_id`, `content TEXT` (or `content_ref`), `fts TSVECTOR` _(for Postgres FTS)_

## 5) Elections

**election**

- `id`, `world_id`, `type {GENERAL, BYELECTION}`, `called_at`, `polling_day`, `status {ANNOUNCED, POLLING, COUNTING, DECLARED}`

**candidacy**

- `id`, `world_id`, `election_id`, `constituency_id`, `party_id`, `mp_id?`, `player_id?`, `statement_ref?`

**election_result**

- `id`, `world_id`, `election_id`, `constituency_id`, `winner_party_id`, `winner_mp_id?`, `turnout_pct NUMERIC(5,2)`, `votes JSONB`

## 6) Safety, Moderation & Community

**report**

- `id`, `world_id`, `reporter_player_id?`, `subject_kind {PLAYER, SPEECH, MOTION, MESSAGE}`, `subject_id`, `reason`, `created_at`, `severity {LOW, MEDIUM, HIGH}`

**moderation_case**

- `id`, `world_id`, `report_id`, `assigned_to_mod_id?`, `status {TRIAGE, INVESTIGATING, RESOLVED}`, `notes`

**moderation_action**

- `id`, `world_id`, `case_id`, `action {HIDE, WARN, MUTE, TEMP_BAN, PERM_BAN, REVERT}`, `target_kind`, `target_id`, `expires_at?`, `reason`

**appeal**

- `id`, `world_id`, `action_id`, `appellant_player_id`, `status {OPEN, UPHELD, OVERTURNED}`, `decision_notes`

**transparency_log**

- `id`, `world_id`, `summary`, `data JSONB`, `published_at`

## 7) AI / NPC Simulation (local models only)

**npc_agent**

- `id`, `world_id`, `type {NPC_MP}`, `name`, `params JSONB` (ideology vector, risk tolerance), `enabled BOOL`

**agent_state**

- `id`, `world_id`, `agent_id`, `tick_no BIGINT`, `state JSONB` (memory, stance, relationships)

**agent_intent** _(logged decisions for auditability)_

- `id`, `world_id`, `agent_id`, `context JSONB`, `intent JSONB` _(schema: `{speak, voteChoice, proposeAmendment, justification}`)_, `generated_at`

**simulation_tick**

- `id`, `world_id`, `tick_no`, `started_at`, `ended_at`, `stats JSONB`

## 8) Messaging, Notifications, Media (optional MVP)

**message**
Lightweight player messages (if needed).

- `id`, `world_id`, `from_player_id`, `to_player_id?`, `channel {DIRECT, PARTY, PUBLIC}`, `content`, `posted_at`

**notification**

- `id`, `world_id`, `player_id`, `kind`, `payload JSONB`, `read_at?`

**news_item** _(optional media/narrative)_

- `id`, `world_id`, `headline`, `body_ref`, `published_at`, `tags TEXT[]`

## 9) Observability, Ops & Integrity

**audit_event**
Immutable record of sensitive actions.

- `id`, `world_id`, `actor_kind {PLAYER, SYSTEM, MOD}`, `actor_id?`, `action`, `resource_kind`, `resource_id`, `before JSONB?`, `after JSONB?`, `hash`, `prev_hash?`, `created_at`

**outbox_event**
For reliable publish → WebSocket/Redis PubSub.

- `id`, `world_id`, `topic`, `payload JSONB`, `created_at`, `processed_at?`, `retries INT`

**idempotency_key**

- `id`, `world_id`, `key UUID UNIQUE(world)`, `request_hash`, `response_snapshot JSONB`, `created_at`, `expires_at`

**job**
Background tasks.

- `id`, `world_id?`, `type`, `payload JSONB`, `run_at`, `status {QUEUED, RUNNING, DONE, FAILED}`, `last_error?`

**file_object**
For transcripts/evidence on local FS or MinIO.

- `id`, `world_id`, `bucket`, `key`, `mime`, `size`, `sha256`, `created_at`

## 10) Enumerations (reference)

- `role`: `PLAYER`, `MODERATOR`, `ADMIN`
- `party_role`: `MEMBER`, `WHIP`, `LEADER`, `DEPUTY`
- `chamber`: `COMMONS` _(extendable)_
- `debate_state`: `QUEUED`, `LIVE`, `SUSPENDED`, `ADJOURNED`, `CLOSED`
- `vote_choice`: `AYE`, `NO`, `ABSTAIN`
- `mod_action`: `HIDE`, `WARN`, `MUTE`, `TEMP_BAN`, `PERM_BAN`, `REVERT`
- `election_status`: `ANNOUNCED`, `POLLING`, `COUNTING`, `DECLARED`

---

## Core Relationship Sketch (ERD-style)

```
user 1─* session
user 1─* role_assignment *─1 world
user 1─* player_profile *─1 world

world 1─* party 1─* party_membership *─1 player_profile
world 1─* constituency 1─1 mp *─? player_profile
bill 1─* bill_stage
order_paper_item → (motion | bill_stage)
debate 1─* speech
division 1─* vote (by mp)
election 1─* election_result (per constituency), 1─* candidacy

report 1─1 moderation_case 1─* moderation_action 1─? appeal
npc_agent 1─* agent_state, 1─* agent_intent
```

---

## Index & FTS Hints (Postgres)

- `CREATE INDEX ON mp (tenant_id, constituency_id);`
- `CREATE INDEX ON vote (tenant_id, division_id, voter_mp_id);`
- `CREATE INDEX ON debate (tenant_id, state);`
- `ALTER TABLE hansard_transcript ADD COLUMN fts tsvector;`
- `CREATE INDEX hansard_fts_idx ON hansard_transcript USING GIN (fts);`
- Trigger to update `fts` from `content`.

## Minimal SQL Seed (example)

```sql
CREATE TYPE vote_choice AS ENUM ('AYE','NO','ABSTAIN');

CREATE TABLE party (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  abbrev text,
  standing_orders jsonb NOT NULL DEFAULT '{}',
  whip_policy jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX party_name_uq ON party (tenant_id, lower(name));
```

_(Repeat pattern for other core tables.)_

## What's MVP-Critical vs. Later

**MVP-Critical:** `world, user, session, role_assignment, player_profile, party, party_membership, constituency, mp, session_parliamentary, sitting_day, order_paper_item, motion, debate, speech, division, vote, audit_event, outbox_event, idempotency_key`.

**Later:** `bill/bill_stage, amendment, election/*, moderation appeals (advanced), news_item, messaging`, richer AI `agent_state` memory.

Update this catalogue whenever new aggregates are introduced or relationships change; keep schema diffs linked to ADRs and DPIA updates.
