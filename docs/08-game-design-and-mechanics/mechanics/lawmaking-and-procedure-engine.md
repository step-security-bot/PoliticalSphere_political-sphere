# Lawmaking and Procedure Engine

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-11-19  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Overview

The Lawmaking and Procedure Engine governs how legislation is proposed, debated, and voted upon in Political Sphere. The system emphasizes procedural realism, strategic debate, and transparent voting while maintaining continuous real-time gameplay.

---

## Core Principles

- **Continuous Real-Time Operation:** Sessions run continuously without fixed durations or turn-based restrictions
- **Procedural Authenticity:** Based on real parliamentary procedure with Speaker-enforced rules
- **Transparent Voting:** All votes are public and recorded, creating permanent voting records
- **Strategic Debate:** Structured discourse with interruption mechanics and points of order
- **Flexible Participation:** Players can join sessions in progress

---

## Session Flow

### Session Lifecycle

1. **Session Opening:** Speaker calls the session to order
2. **Agenda Setting:** Order of business established (questions, statements, debates, votes)
3. **Continuous Operation:** Business proceeds without fixed time limits
4. **Late Joining:** Players can join active sessions and participate from that point
5. **Session Closure:** Speaker adjourns when business is complete or at natural break points

### No Fixed Duration

- Sessions last as long as needed to complete business
- Players are not required to attend entire sessions
- Absence may affect reputation but does not block session progress
- AI NPCs maintain quorum when needed

---

## Debate Mechanics

### Speaking Order

- **Speaker's List:** Speaker manages queue of members wishing to speak
- **Priority Rules:** Government ministers, opposition leaders, and bill sponsors get priority
- **Fair Distribution:** Speaker ensures balanced representation across parties and views

### Speech Management

- **No Hard Time Limits:** Speaker manages speech length contextually rather than strict timers
- **Speaker Intervention:** Speaker can request members conclude if speeches become excessive
- **Relevance Enforcement:** Speaker rules on whether remarks are germane to debate

### Interruption System

Members may interrupt for specific purposes:

1. **Giving Way:** Speaker must explicitly give way for another member to interject
   - Speaker can accept or decline
   - Brief interventions expected
2. **Points of Order:** Challenge procedural violations immediately
   - Suspends current speech
   - Speaker rules on the point
   - Play resumes based on ruling
3. **Points of Information:** Request factual clarification (at Speaker's discretion)

### Points of Order

Players can raise points of order to challenge:

- Procedural irregularities
- Violations of standing orders
- Unparliamentary language
- Relevance of debate
- Voting irregularities

**Resolution:**
- Speaker hears the point
- Makes immediate ruling
- Ruling can be challenged (rare, requires significant support)

---

## Voting System

### Vote Types

The legislation being voted upon determines the threshold required:

1. **Simple Majority:** Default for most motions and bills (50% + 1)
2. **Supermajority:** Constitutional amendments, emergency powers (60-75% depending on matter)
3. **Unanimous Consent:** Procedural matters, time agreements
4. **Absolute Majority:** Some appointments and confidence motions (majority of total members, not just present)

### Voting Process

1. **Division Called:** Speaker calls for a vote
2. **Public Recording:** Each member's vote is recorded publicly
3. **Abstention Allowed:** Members can abstain
   - No penalty for procedural votes
   - May affect reputation for significant legislation
   - Party dynamics may create pressure
4. **Tallying:** Automatic calculation with Speaker verification
5. **Result Declaration:** Speaker announces outcome
6. **Permanent Record:** Vote recorded in permanent legislative record (Hansard equivalent)

### Voting Records

- **Transparency:** All votes are public and searchable
- **Historical Analysis:** Media and players can track voting patterns
- **Political Consequences:** Inconsistent voting affects reputation
- **Party Discipline:** Parties may track member loyalty (not enforced mechanically)

---

## Legislative Process

### Bill Stages

1. **First Reading:** Bill introduced, no debate
2. **Second Reading:** Debate on principles
3. **Committee Stage:** Detailed examination, amendments proposed
4. **Report Stage:** Committee reports back, further amendments
5. **Third Reading:** Final debate and vote
6. **Royal Assent:** Ceremonial approval (automatic if passed)

### Amendment System

- Members can propose amendments at committee and report stages
- Amendments debated and voted separately
- Multiple amendments can be grouped ("en bloc") by agreement
- Procedural protections prevent wrecking amendments

### Fast-Track Procedures

Emergency legislation can bypass normal stages with:
- Government motion
- Supermajority support
- Speaker approval

---

## Speaker Role

### Responsibilities

- **Order Maintenance:** Enforce standing orders and procedural rules
- **Debate Management:** Control speaking order, interruptions, and time
- **Ruling Authority:** Make binding procedural decisions
- **Impartiality:** Maintain political neutrality
- **Vote Casting:** Break ties (rare, usually abstains)

### Speaker Powers

- Eject disruptive members from chamber
- Suspend standing orders (with house approval)
- Rule motions out of order
- Name members for serious breaches
- Allocate speaking time fairly

### Speaker Selection

- Elected by house members
- Human players preferred but AI can serve
- Serves until resignation, removal, or new parliament
- Must maintain cross-party respect

---

## Procedural Safeguards

### Anti-Filibuster Measures

- Speaker can closure prolonged debate with house support
- Guillotine motions allocate fixed time to remaining stages
- Dilatory tactics are ruled out of order

### Minority Protections

- Opposition days for alternative business
- Urgent questions to government
- Emergency debates on pressing matters
- Committee representation proportional to house

### Quorum Requirements

- Minimum members needed to conduct business
- AI NPCs counted toward quorum
- Speaker can suspend if quorum not met
- Reduced quorum for committee work

---

## Integration with Game Systems

### Reputation Impact

- Quality of debate contributions affects reputation
- Procedural violations reduce reputation
- Effective legislative work builds reputation
- Cross-party collaboration valued

### Resource Costs

- Introducing legislation costs influence points
- Complex bills require staff time
- Campaign promises create obligations
- Party resources support legislative agenda

### Media Coverage

- Significant debates generate media attention
- Controversial votes create storylines
- Procedural disruptions are newsworthy
- Legislative victories boost standing

---

## Technical Implementation

### Real-Time Processing

- WebSocket connections for live session updates
- Event-driven architecture for speaker actions
- Optimistic UI updates with server reconciliation
- State synchronization across connected clients

### Vote Recording

- Cryptographic signatures on votes (integrity)
- Immutable append-only vote log
- Public API for vote history queries
- Audit trail for all voting events

### Accessibility

- Screen reader support for chamber proceedings
- Keyboard navigation for all procedural actions
- Clear visual indicators of speaking order
- Text alternatives for procedural states

---

## Future Enhancements

- **Committee Simulations:** Detailed committee mechanics with witness testimony
- **Private Members' Bills:** Individual MP initiatives with ballot system
- **Delegated Legislation:** Secondary legislation and statutory instruments
- **Parliamentary Questions:** Question Time mechanics with ministerial responses
- **Select Committees:** Cross-party investigative committees

---

## Related Documents

- [Elections, Policy and Mechanics](./elections-policy-and-mechanics.md)
- [Game Design Document](../game-design-document-gdd.md)
- [AI NPC Behaviours](../systems/ai-npc-behaviours-and-tuning.md)
- [Roles and Progressions](../systems/roles-and-progressions.md)
