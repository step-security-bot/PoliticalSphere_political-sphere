# AI Strategy and Differentiation

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Overview

Political Sphere uses AI ethically and constrainedly to enhance gameplay without compromising safety, fairness, or the simulation's integrity. AI is a tool for immersion and efficiency, not persuasion or ideology.

## AI Role in Political Sphere

AI exists to:

- Fill NPC roles (e.g., MPs in small worlds)
- Enforce rules and moderate content
- Assist human moderators
- Summarize debates for players
- Provide procedural guidance

AI does **not**:

- Persuade players politically
- Manipulate emotions
- Harvest or analyze personal data
- Opininate about real-world ideology
- Turn into propaganda or activism tools

## Differentiation: Ethical, Bounded AI

### Human-Guided, Ethics-Constrained

- All AI prompts are rule-based and constrained to fictional, internal-world behavior.
- No real-world political content in prompts.
- Human oversight on all AI moderation decisions.
- AI actions are logged and explainable.

### Local Models Only

- Use self-hosted, local AI models (e.g., Ollama, local LLMs).
- No cloud dependencies or external data sharing.
- Aligns with zero-budget, privacy-first ethos.

### Transparency and Auditability

- AI decisions are logged with reasoning.
- Players can appeal AI-moderated actions.
- No "black box" AI; all behavior is traceable.

## Competitive Advantages from AI Strategy

1. **Trustworthy NPCs:** AI fills seats without human burnout, maintaining world activity.
2. **Scalable Moderation:** Assists in enforcing rules at scale, but humans retain control.
3. **Enhanced Immersion:** NPCs behave procedurally, adding depth without ideology.
4. **Safety Moat:** Ethical constraints prevent misuse, building player confidence.
5. **Cost-Effective:** Local models keep costs zero, no API fees.

## Risks and Mitigations

- **Misalignment Risk:** AI behavior could drift from ethics.
  - Mitigation: Strict prompt engineering, regular audits, human overrides.

- **Perception of Bias:** Players might see AI as unfair.
  - Mitigation: Full transparency, appeals process, explainability logs.

- **Over-Reliance:** Humans might trust AI too much.
  - Mitigation: AI as assistant, not authority; human final say.

## Implementation Principles

- **Minimalism:** AI only where it adds value without risk.
- **Containment:** AI stays within fictional political universe.
- **Iterative:** Start simple (rule-based NPCs), expand with testing.
- **Compliance:** Adhere to AI ethics guidelines (e.g., EU AI Act).

## Alignment with Vision

This AI strategy supports the core mission: a fair, persistent simulation where conduct and strategy matter. AI enhances without dominating, preserving human agency and ethical boundaries.

## Audience & scope

Audience: product, engineering, operations, legal, community moderators and governance reviewers.

Scope: high-level strategic guidance. This document defines policy, guardrails, and governance expectations. Implementation-level artifacts (prompt templates, model whitelists, deployment manifests, and audit schemas) should live in companion documents under `/docs/` or `/libs/` and will be referenced from this strategy where appropriate.

## Regulatory compliance

This project must comply with GDPR, the EU AI Act, and other applicable regulations. Required actions include:

- Data subject rights: support access, correction, deletion, portability where applicable.
- Maintain Records of Processing Activities (ROPA) for AI processing tasks.
- Conduct DPIAs for high-risk AI features (moderation that impacts access or reputation).
- Keep legal and compliance teams in the loop for model selection and data usage approvals.

See `docs/03-legal-and-compliance/` for related policies and templates.

## Data policy (summary)

Privacy-by-default. Preferred sources and restrictions:

Allowed (with notes):

- Synthetic data — ✅ Preferable for political behaviour & events simulation.
- In-game logs & system telemetry — ✅ Gameplay telemetry, system performance, AI agent behaviour.
- Player-generated content (PGC) — ✅ With explicit informed consent (opt-in only). Clear revocation.
- Player behavioural data (non-text) — ✅ With consent and anonymisation.
- Public domain official documents — ✅ Statutes, parliamentary procedure documents.
- Open-licensed civic datasets — ✅ License check required.
- Academic datasets — ✅ If license allows.
- Synthetic roleplay transcripts — ✅ Useful for NPC personas.

Prohibited / restricted:

- Real-world private messages or personal data — ❌ Forbidden.
- Player content without explicit consent — ❌ Forbidden.
- Sensitive political views tied to real identities — ❌ Forbidden.
- Social media scraping — ❌ Forbidden unless licensed and anonymised.
- Biometric/psychometric data — ❌ Forbidden.
- Real-world voting data tied to individuals — ❌ Absolutely forbidden.

Operational principles: synthetic over scraped; minimise PII; explicit consent for PGC; license checks for external data.

## Model policy & recommended approach

Policy: only approved, auditable, and license-compatible models should be used. Any candidate model must pass a legal and security review before being added to a whitelist.

Recommended pragmatic starting point (to be validated by legal/licensing): favour smaller, quantized models for local inference to meet the "local models only" principle. Candidate families to evaluate (license permitting):

- Llama-family (7B/13B) quantized builds (ggml / llama.cpp) — good CPU inference footprint
- Mistral / MPT 7B (subject to license)
- Falcon / Other permissively licensed 7B models

Notes:

- Perform license and export-control checks before use.
- Maintain a documented whitelist with semantic versions and release hashes.
- Use quantization and optimized runtimes (ggml, llama.cpp, Ollama, or similar) to enable local inference on modest hardware. For heavier workloads, use dedicated on-prem GPUs with strict access controls.

## Deployment constraints & options

Baseline developer hardware (example): MacBook Pro 2018 — 6-core i7, 16GB RAM — may run quantized ~7B models with optimized runtimes. For heavier models, provision on-prem or rented GPU hosts with clear procurement and security review.

Deployment recommendations:

- Prefer local, quantized models for privacy and auditability.
- Avoid third‑party cloud model APIs unless explicitly approved and contract-reviewed.
- Use feature flags, shadow/canary deployments, and progressive rollouts.

## Governance, moderation flow & appeals

Operational flow (triage): AI filter → Human Moderator → Senior Moderator / Panel.

Appeal SLAs (recommended):

| Appeal Level              |          SLA | Notes                                    |
| ------------------------- | -----------: | ---------------------------------------- |
| Standard appeal           |     72 hours | Fair turnaround without rushing judgment |
| Urgent / access-impacting |     24 hours | Account suspension or access loss        |
| Panel / complex cases     |     5–7 days | Allows investigation and due process     |
| Edge/legal                | Case-by-case | Communicate timelines to player          |

All appeals receive immediate confirmation and an expected decision timeframe.

Retention policy (summary):

- AI moderation decisions — retain 12 months.
- Human reviews & overrides — retain 12 months.
- Appeal records — retain 12–24 months.
- Audit trail for fairness/accuracy reviews — retain 24 months.
- Aggregate, non-identifiable logs — indefinite.

Principles: minimise PII, anonymise where possible, publicize retention windows.

## Explainability & audit logging

Every automated moderation decision must be explainable to a human and reproducible for auditors. Baseline explainability includes:

- Human-readable rationale (plain English)
- Timestamp (ISO-8601 UTC)
- Decision + severity + policy clauses triggered
- Model identifier + semantic version + model hash
- Inference params (temperature, top-p, seed) + latency
- Inputs/outputs hashed (avoid storing raw PGC when not necessary)
- Reviewer/actor chain (AI → human)

Elevated decisions (suspension/ban/appeals) require full artifacts: prompt template, redacted inputs or encrypted blobs, confidence, precedent links, and human sign-off.

Suggested audit event schema (trimmed example):

```json
{
  "event_id": "ulid-...",
  "event_type": "moderation.decision",
  "timestamp_utc": "2025-11-01T10:42:13Z",
  "actor": { "type": "ai", "id": "ps-mod-mlm@1.4.2" },
  "subject": { "player_id": "player_7f2a", "content_id": "msg_98ad" },
  "model": { "id": "ps-mod-mlm@1.4.2", "hash_sha256": "3b0c...e91a" },
  "inputs": { "prompt_template_id": "moderation_v7", "input_hash_sha256": "2f8a...77bc" },
  "decision": { "outcome": "mute", "severity": "medium", "confidence": 0.86 },
  "security": { "pii_present": false, "retention_expiry": "2026-10-31T00:00:00Z" },
  "version": "audit_schema_v1.2"
}
```

Integrity: prefer ULIDs for sortable IDs, ISO-8601 UTC timestamps, Ed25519 signatures for append-only integrity, and daily Merkle roots for tamper-evidence. Hash raw PGC (SHA-256); store encrypted blobs only when necessary for appeals.

## Operational metrics & SLOs (recommended)

Track at minimum:

- Moderation false positive / false negative rates
- Percentage of AI decisions escalated to humans
- Median / p95 inference latency
- Appeal rate and appeal outcome ratio
- Model drift indicators (change in confidence distributions)

Suggested SLOs (example placeholders):

- Moderation latency (AI decision): p95 < 500ms
- Appeal acknowledgement: 100% within 24 hours

## Testing & validation

Required testing before rollout:

- Unit tests for rule logic and data transformations
- Integration tests for runtime and logging pipelines
- Behavior tests for model outputs (acceptable/unacceptable examples)
- Regular bias/fairness audits and red-team adversarial testing (periodic)

## Next steps & artifacts

Recommended companion artifacts to author and version in-repo:

- Prompt templates and prompt testing harness (`/docs/ai/prompt-templates.md`)
- Audit log schema and examples (`/docs/ai/audit-schema.md`)
- Model whitelist and approval checklist (`/docs/ai/model-whitelist.md`)
- Deployment runbook and feature-flag guide (`/docs/ops/ai-deployments.md`)

Per project policy, small changes to rules/guidance that affect the assistant instruction set should be proposed to both `.blackboxrules` and `.github/copilot-instructions.md` as parallel edits (do not apply automatically without explicit approval).

## Ownership & review

Owner: Documentation Team (as indicated in the header). Review cycle: Quarterly (retain but ensure review includes legal + security teams where relevant).

---

Last updated: 2025-11-01 (expanded with governance, audit schema, model guidance and operational notes)
