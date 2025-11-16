# Data Directory README

## 1. Directory Identity & Purpose

**Directory Name:** data

**Short Description:** This directory contains runtime data, seed data, test fixtures, and datasets for the Political Sphere application.

**Role within the System:** Manages all data-related assets, including database files, seed data for initialization, test fixtures, and datasets for development and testing.

**Unique Value:** Centralizes data management, ensuring consistent seeding, testing, and data versioning across the platform.

**Intended Audience:** Developers (for data setup), testers (for fixtures), data engineers (for datasets).

**Classification/Category:** Data management (within central TODO list).

## 2. Scope, Boundaries, & Responsibilities

**Responsibilities:** Store seed data, test fixtures, runtime databases, and datasets. Support data seeding, testing, and versioning.

**Not Responsible For:** Application code (in apps/), shared libraries (in libs/), documentation (in docs/), or assets (in assets/).

**Functional Scope:** Data storage and management. Expected behavior: data loads correctly, databases initialize properly.

**Architectural Domain:** Data layer in the system architecture.

**Key Files and Subdirectories:**

- `seeds/`: Seed data for initialization
- `fixtures/`: Test fixtures
- `datasets/`: Dataset files
- `issues/`: Data issues tracking
- Runtime .db files (gitignored)

**Maturity Level:** Stable

**Current Limitations:** Some datasets may be outdated.

**Known Issues:** Data consistency.

## 3. Criticality, Risk Profile, & Access Level

**Criticality:** Medium (affects testing and seeding)

**Risk Level:** Low (data issues don't break core functionality)

**Volatility:** Moderately stable

**Required Skill Levels:** Beginner to intermediate

**Required AI Personas:** Data-focused

**Access/Permission Restrictions:** Standard access; sensitive data review.

**Sensitive Areas:** PII in seeds/fixtures.

## 4. Dependencies, Interfaces, & Integration Contracts

**Internal Dependencies:** Scripts in scripts/data/

**External Dependencies:** SQLite, DVC

**Upstream:** Receives data from scripts/

**Downstream:** Provides data to apps/

**Integration Expectations:** Data loaded via npm scripts.

**Public Interfaces:** Seed/test scripts

**Contracts:** JSON schemas for fixtures

**Data Flows:** Scripts → data → apps

**Assumptions:** SQLite for databases

**Volatile Dependencies:** External datasets

## 5. Operational Standards, Practices, & Tooling

**Languages:** JSON, SQL

**Conventions:** JSON formatting

**Operational Rules:** DVC for versioning

**Tooling:** SQLite, DVC

**Code Quality:** Valid JSON

**Tests:** Data validation scripts

**Logging:** N/A

**Error Handling:** Script failures

**Performance:** Fast loading

**Patterns:** Structured JSON

**References:** docs/04-architecture/data-architecture.md

## 6. Future Direction, Roadmap, & Definition of Done

**Long-term Purpose:** Expand datasets, improve versioning.

**Roadmap:** Add more fixtures, automate seeding.

**Definition of Done:** All data loads without errors.

**Missing Components:** Some test fixtures.

**Upcoming Integrations:** New datasets.

**Test Coverage Goals:** 100% data validation

**Automation Needs:** Auto-seeding

**Upstream Work:** Update scripts

**Risks/Blockers:** Data privacy

## 7. Assumptions, Constraints, & Architectural Guarantees

**Assumptions:** SQLite databases, JSON fixtures.

**Constraints:** No large files in git.

**Guarantees:** Data integrity.

**Forbidden Patterns:** Committing .db files

## 8. Common Pitfalls, Anti-Patterns, & Lessons Learned

**Pitfalls:** Committing runtime files.

**Anti-Patterns:** Hardcoded data.

**Misunderstandings:** Assuming data availability.

**Failure Modes:** Seeding failures.

**Warnings:** Sensitive data.

**Best Practices:** Use DVC for versioning.

## 9. Maintenance, Ownership, & Review Cycle

**Ownership:** Data team.

**Review Processes:** Code review.

**Review Cadence:** On changes.

**Refactoring:** With tests.

**Escalation:** To data lead.
