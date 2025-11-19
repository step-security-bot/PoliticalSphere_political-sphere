# Roles and Responsibilities (RACI)

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Overview

This document defines the Roles and Responsibilities using the RACI matrix (Responsible, Accountable, Consulted, Informed) for key activities in Political Sphere. RACI clarifies who does what, ensuring accountability and preventing overlaps or gaps.

- **R (Responsible):** Executes the task.
- **A (Accountable):** Ultimately answerable for the task's completion and quality.
- **C (Consulted):** Provides input or expertise before decisions.
- **I (Informed):** Kept updated on progress and outcomes.

## Key Roles

| Role                              | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| **Lead Developer**                | Oversees technical development, architecture, and code quality. |
| **Product Manager**               | Defines product vision, prioritizes features, manages roadmap.  |
| **Community Manager**             | Handles player relations, moderation, feedback loops.           |
| **Security Officer**              | Ensures security, compliance, and risk management.              |
| **QA Tester**                     | Tests features, reports bugs, validates releases.               |
| **Moderator**                     | Enforces rules, handles reports, maintains safety.              |
| **Player (General)**              | Participates in gameplay, provides feedback.                    |
| **Player Leader (e.g., Speaker)** | Leads in-game governance (e.g., parliamentary procedures).      |

## RACI Matrix

### 1. Feature Development

| Activity             | Lead Developer | Product Manager | QA Tester | Security Officer | Community Manager |
| -------------------- | -------------- | --------------- | --------- | ---------------- | ----------------- |
| Define requirements  | C              | R               | I         | C                | C                 |
| Design architecture  | R              | A               | I         | C                | I                 |
| Implement code       | R              | I               | I         | I                | I                 |
| Test functionality   | I              | I               | R         | C                | I                 |
| Deploy to production | R              | A               | I         | C                | I                 |
| Monitor post-release | I              | I               | I         | R                | C                 |

### 2. Player Safety & Moderation

| Activity              | Moderator | Community Manager | Security Officer | Lead Developer | Product Manager |
| --------------------- | --------- | ----------------- | ---------------- | -------------- | --------------- |
| Monitor gameplay      | R         | I                 | I                | I              | I               |
| Handle reports        | R         | A                 | C                | I              | I               |
| Investigate incidents | R         | C                 | C                | I              | I               |
| Apply sanctions       | R         | A                 | I                | I              | I               |
| Review appeals        | R         | C                 | I                | I              | I               |
| Update policies       | I         | R                 | C                | C              | A               |

### 3. Governance & Policy Changes

| Activity             | Product Manager | Lead Developer | Security Officer | Community Manager | Moderator |
| -------------------- | --------------- | -------------- | ---------------- | ----------------- | --------- |
| Propose changes      | R               | C              | C                | C                 | I         |
| Assess impacts       | A               | C              | R                | C                 | I         |
| Consult stakeholders | I               | I              | I                | R                 | C         |
| Approve changes      | A               | I              | I                | I                 | I         |
| Implement changes    | I               | R              | I                | I                 | I         |
| Communicate changes  | I               | I              | I                | R                 | I         |

### 4. Risk Management

| Activity         | Security Officer | Lead Developer | Product Manager | Community Manager | QA Tester |
| ---------------- | ---------------- | -------------- | --------------- | ----------------- | --------- |
| Identify risks   | R                | C              | C               | C                 | I         |
| Assess severity  | R                | I              | A               | I                 | I         |
| Mitigate risks   | R                | C              | I               | I                 | I         |
| Monitor risks    | R                | I              | I               | I                 | I         |
| Report incidents | R                | I              | I               | A                 | I         |

### 5. Community Engagement

| Activity             | Community Manager | Product Manager | Moderator | Lead Developer | Player Leader |
| -------------------- | ----------------- | --------------- | --------- | -------------- | ------------- |
| Collect feedback     | R                 | A               | I         | I              | I             |
| Analyze trends       | R                 | C               | I         | I              | I             |
| Respond to issues    | R                 | I               | C         | I              | I             |
| Organize events      | R                 | C               | I         | I              | C             |
| Moderate discussions | I                 | I               | R         | I              | I             |

### 6. In-Game Governance

| Activity           | Player Leader | Moderator | Community Manager | Product Manager | Lead Developer |
| ------------------ | ------------- | --------- | ----------------- | --------------- | -------------- |
| Enforce rules      | R             | C         | I                 | I               | I              |
| Facilitate debates | R             | I         | I                 | I               | I              |
| Manage elections   | R             | I         | I                 | I               | I              |
| Handle disputes    | R             | C         | A                 | I               | I              |
| Update procedures  | R             | I         | C                 | A               | I              |

## Notes

- **Platform vs. In-Game:** Platform roles (e.g., Lead Developer) handle real-world operations. In-game roles (e.g., Player Leader) handle simulation governance.
- **Escalation:** If responsibilities overlap or conflicts arise, escalate to the Product Manager or Governance Panel.
- **Updates:** This RACI matrix should be reviewed quarterly or after major changes.
- **Training:** All roles should receive training on their responsibilities and the RACI model.
