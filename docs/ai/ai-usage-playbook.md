# AI Usage Playbook (Political Sphere)

_Last reviewed: 2025-11-18 — Owner: Engineering_

## Purpose

Single-page guide for any AI tool (Copilot, Blackbox, Kilo Code, Codex CLI, MCP). Use this before invoking an assistant to keep outputs effective, safe, neutral, and cheap.

## Default Role & Process

- Role: Senior TypeScript/React/Nx engineer; security-first (OWASP ASVS), accessibility-first (WCAG 2.2 AA), politically neutral; respects zero-trust and privacy.
- If unsure about compliance, data sensitivity, or policy impact, ask first.
- Loop: (1) Restate goal, (2) gather missing context, (3) propose plan + tests, (4) implement minimal change, (5) show diff + commands to verify.

### Standard Prompt Block (copy-paste into any AI chat)

```
Role: Senior TS/React/Nx engineer. Enforce strict TS, WCAG 2.2 AA, OWASP ASVS. Maintain political neutrality.
Process: clarify -> small plan -> propose tests first -> implement minimal change -> report diff + commands.
Guardrails: no secrets; cite sources (GitHub Docs, Microsoft Learn, Nx docs, WCAG 2.2, OWASP ASVS); stop if context missing; highlight risks/assumptions.
Outputs: tests + docs updates; commands to run; note execution mode (Safe/Fast-Secure/Audit/R&D).
```

## Execution Modes (aligns with `.github/PULL_REQUEST_TEMPLATE.md`)

- Safe: default; small changes, full checks.
- Fast-Secure: time-boxed; run targeted checks; defer low-risk gates but list them.
- Audit: high rigor; record evidence (logs, reports, links).
- R&D: exploratory; must rerun in Safe before merge.

## Commands & Scripts

- Quick health: `npm run ai:preflight` (FAST_AI=1) — runs status, health, and context refresh in light mode.
- Index/search: `npm run ai:index` then `npm run ai:search -- "<query>"` (use FAST_AI=1 for speed).
- Neutrality check: `node tools/scripts/ai/ci-neutrality-check.mts <files>` (runs in CI; use locally before PRs touching political content).
- MCP (local, £0-first): start only local MCP servers unless the task truly needs remote models. Examples:
  - `npm run mcp:filesystem`
  - `npm run mcp:git`
  - `npm run mcp:political-sphere`
- Cache hygiene: `npm run ai:rotate-cache` (DAYS=30 default) to prune old index/cache artifacts.

## Context Discipline

- Load only relevant paths (apps/_, libs/_) and avoid dumping large files; prefer indexes built by `ai:index`.
- Track assumptions and dependencies in the PR template; log architectural changes as ADRs in `docs/architecture/adr/`.

## Quality Gates

- Accessibility: WCAG 2.2 AA (https://www.w3.org/TR/WCAG22/); runnable axe-core tests for UI changes.
- Security: OWASP ASVS sections relevant to change; never emit secrets; validate inputs/outputs.
- Type safety: strict TypeScript; no `any` unless justified.
- Neutrality: avoid partisan tone; cite `docs/07-ai-and-simulation/ai-governance.md` when in doubt.

## When to Escalate

- Anything affecting voting, speech, moderation, power, or policy → mark in PR checklist, add ADR, and request human review.
- Unclear data protection/PII flows → perform DPIA (see `docs/06-security-and-risk/`).

## References

- GitHub Docs — Copilot repo instructions & scoped instructions.
- Nx documentation — inputs/outputs and task caching: https://nx.dev/concepts/inputs-outputs
- WCAG 2.2 — https://www.w3.org/TR/WCAG22/
- OWASP ASVS — https://owasp.org/www-project-application-security-verification-standard/
