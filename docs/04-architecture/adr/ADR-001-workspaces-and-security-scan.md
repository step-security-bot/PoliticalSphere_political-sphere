# ADR-001: Monorepo Workspace Scope Expansion & Central Security Scan Script

Date: 2025-11-19
Status: Accepted
Decision Category: Build / Tooling / Security

## Context

The repository previously declared npm workspaces only for `libs/*`, excluding `apps/*`. This caused:

- Incomplete dependency graph resolution (Nx + package manager mismatch)
- Potential duplication of `node_modules` installations and reduced hoisting efficiency
- Harder cross-app refactors (apps not recognized as first-class workspaces)

Security gating (`fast-secure` script) referenced a non-existent `security:scan` script, silently skipping intended vulnerability scanning, creating risk of undetected high/critical vulnerabilities in CI.

## Decision

1. Expand `workspaces` in `package.json` to `["apps/*", "libs/*"]` to bring all application packages under workspace management for consistent install behavior and tooling.
2. Add a mandatory `security:scan` script invoked by `fast-secure` that executes `npm audit` (JSON output captured) and optionally `osv-scanner` if available, enforcing baseline thresholds (critical=0, high<=5).
3. Add supporting artifacts directory `artifacts/security` for machine-parsable vulnerability reports supporting future CI parsing and risk trend analysis.
4. Introduce complementary quality scripts:
   - `perf:enforce` script to hard-fail CI when performance budgets are breached.
   - `ai:health` script to surface AI system metadata health.
5. Remove obsolete `test:frontend` script referencing non-existent `apps/frontend` path; replace with `test:a11y:components` for component-level accessibility validation using `jest-axe` under Vitest.

## Alternatives Considered

- Leave workspaces unchanged and rely solely on Nx project graph: rejected (package manager-level optimizations and tooling synergy lost).
- Implement per-app security scans only: deferred (central baseline faster to adopt; per-app parameterization can follow).
- Use third-party SaaS scanner only: rejected initially (adds cost and latency; local baseline needed first).

## Consequences

Positive:

- Improved hoisting and deterministic installs for applications.
- Restored integrity of the `fast-secure` execution mode per governance rules.
- Early detection of severe vulnerabilities with low configuration overhead.
- Shift-left accessibility checks lower regression risk.
- Foundation for future automated risk trend dashboards.

Negative / Trade-offs:

- Slightly longer preflight due to added audit step.
- Potential false positives requiring curated allowlist process (future enhancement).

## Security Considerations

- Vulnerability thresholds aligned with OWASP ASVS v5.0.0 principle of proactive component risk management.
- JSON artifact enables future SARIF conversion and GitHub Advanced Security ingestion.
- No secrets captured; scans operate on dependency metadata only.

## Compliance & Governance

- Supports supply chain risk reduction (SLSA provenance + SBOM follow-up integration path).
- Enforces project COPILOT instruction core rule: "Secure, accessible, neutral, type-safe." (Security + Accessibility expansions).

## Future Work / TODO

- Parameterize security scan per app (`security:scan:app --app=api`).
- Integrate OSV scanner formally (install dependency, remove optional branch).
- Add SARIF conversion (`npm audit --json` → SARIF) for GitHub upload.
- Extend performance enforcement to auto-populate current metrics file via CI data collection.
- Add mutation testing and flaky test detection gating.

## Status Markers

- Workspace scope change: OPERATIONAL
- `security:scan` script: OPERATIONAL
- `perf:enforce` script: OPERATIONAL
- `ai:health` script: OPERATIONAL
- Component accessibility tests: OPERATIONAL

## References

- OWASP ASVS v5.0.0 (Dependency Verification) 14.2
- SLSA Framework (supply chain integrity) <https://slsa.dev/>
- WCAG 2.2 AA (component-level semantics) <https://www.w3.org/WAI/WCAG22/quickref/>

---
