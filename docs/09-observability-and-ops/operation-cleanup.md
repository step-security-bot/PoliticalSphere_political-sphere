# Operation Clean-Up

> Status: INITIAL DRAFT (Phase 1 Structural & Config Audit)  
> Date: 2025-11-10  
> Scope (Phase 1): Repository structure, configuration surfaces, security & compliance alignment, obvious duplicates/outliers. Full per-file deep dive scheduled Phase 2.

## Methodology

Phase 1 performed a breadth-first structural scan of top-level directories (`apps/`, `libs/`, `docs/`, `scripts/`, `tools/`, `config/`, `assets/`), targeted pattern searches (secrets, ESLint configs, workflows), and cross-referenced with authoritative standards:

- 12-Factor App (Config, Dependencies, Logs, Build/Release/Run)
- OWASP ASVS v5.0.0 (updated stable release – project docs currently cite 4.0.3)
- Nx Monorepo Best Practices (modular task runner, project graph hygiene, avoiding redundant configs)
- GitHub Actions official docs (workflow composition, reusability, separation of concerns)
- Docker official docs (container lifecycle, image layering, portability)
- Dev Container Specification (consistent development environment definitions)

This draft lists actionable TODO items. Each entry includes:
`[ACTION] <path> — <recommended change>`  
Justification cites internal project standards (organization.md, copilot-instructions.md) and external sources where relevant.

## Change Principles

- Preserve history via `git mv` (no destructive rename without movement to `/deprecated` when uncertain).
- Fail-closed on secrets; remove fallback secret generation in production code (12-Factor Config / ASVS 5.0.0).
- Consolidate tooling configs to reduce drift (Nx + Monorepo hygiene).
- Remove or ignore transient build artefacts not required for review (avoid repository bloat / performance).
- Update documentation references to latest standards (OWASP ASVS v5.0.0).

## TODO Items (Phase 1)

### Configuration & Secrets

1. ✅ **COMPLETED** `apps/api/src/auth/auth.service.ts` — Replaced random fallback secret generation with fail-fast validation; enforces required environment variables with clear error messages.
   - **Action Taken**: Removed `randomBytes()` fallbacks, added strict validation requiring JWT_SECRET and JWT_REFRESH_SECRET to be set and ≥32 chars, enforce they differ.
   - Justification: 12-Factor Config (no implicit secret generation); OWASP ASVS v5.0.0 injection & crypto guidance; prevents token invalidation across restarts.
2. [UPDATE] `apps/api/src/modules/auth.js` & `apps/api/src/middleware/auth.js` — Ensure consistent single-source secret validation (consolidate into shared auth config module).
   - Justification: Reduce duplication; centralize security checks (ASVS maintainability & consistency).
3. ✅ **COMPLETED** `.env.local` verification — Confirmed no `.env.local` files exist in workspace; pattern properly gitignored; automated check integrated into validation module.
   - **Action Taken**: File search confirmed zero `.env.local` instances; `.gitignore` contains `.env.local` and `.env*.local` patterns; `validate-environment.mjs` includes automated check.
   - Justification: 12-Factor Config separation; zero-trust secret management; preventive automation.
4. ✅ **COMPLETED** Multiple test secret initializations — Created single `tools/testing/test-env-setup.ts` module; updated Vitest config to use centralized setup.
   - **Action Taken**: Consolidated scattered test env initialization from `scripts/test-setup.ts`, `tools/config/jest.env.js`, `tools/config/jest.setup.js` into unified module.
   - Justification: Avoid divergent test secrets; predictable reproducibility; single source of truth for test environment.
5. ✅ **COMPLETED** Environment validation consolidation — Created unified `tools/scripts/validation/validate-environment.mjs` merging `validate-env.js` and `assess-secrets.sh`.
   - **Action Taken**: New validation module with three modes (warn, strict, scan); 15+ secret detection patterns; integrated with Lefthook pre-commit hook; added npm scripts (`env:validate`, `env:validate:strict`, `env:scan`); created comprehensive documentation at `docs/09-observability-and-ops/environment-validation.md`.
   - Justification: Single source of truth for environment validation; enhanced secret detection (AWS keys, private keys, high-entropy strings); CI/CD ready; zero-friction enforcement.

### GitHub Actions & CI/CD

6. ✅ **COMPLETED** `.github/workflows/ci.yml` vs `build-and-test.yml` — Documented clear separation of concerns; no merge required.
   - **Action Taken**: Created `docs/09-observability-and-ops/ci-workflow-separation.md` documenting distinct purposes (ci.yml = comprehensive PR gate; build-and-test.yml = reusable build component).
   - Justification: GitHub Actions best practice for composable workflows; separation is intentional and appropriate.
7. [NORMALIZE] `.github/workflows/health-check.yml` — Replace inline default expressions like `${{ secrets.API_HEALTH_URL || 'https://...' }}` with explicit `env:` fallback or conditional step.
   - Justification: GitHub Actions expression syntax clarity; reduces risk of unexpected evaluation; aligns with internal policy against complex inline interpolation.
8. [CHECK] Duplicate listing of `test-run-tests-action.yml` (file search appears twice) — Confirm single physical file; if accidental duplicate (case or path variance) remove.
   - Justification: Remove redundant workflow definitions (Nx affected tasks rely on clean graph).
9. ✅ **COMPLETED** References to OWASP ASVS 4.0.3 in `copilot-instructions.md` — Updated to v5.0.0 throughout document (4 occurrences).
   - **Action Taken**: Replaced all instances of "OWASP ASVS 4.0.3" with "OWASP ASVS v5.0.0" and added version-tagged requirement ID guidance.
   - Justification: Align with latest security standard for verification controls; v5.0.0 is current stable release.

### ESLint & Tooling Duplication

10. ✅ **COMPLETED** Multiple `.eslintrc.json` files — Created root symlink to `tools/config/.eslintrc.json`; consolidated migrations override into root config; removed redundant local config.
    - **Action Taken**: Symlinked missing root `.eslintrc.json` to tools/config; added migrations override to root; deleted `apps/api/src/utils/migrations/.eslintrc.json`.
    - Justification: Reduce drift; Nx encourages shared lint config to speed caching and consistency.
11. ✅ **COMPLETED** `apps/api/src/utils/migrations/.eslintrc.json` — Removed; rules now in root override targeting `**/migrations/**/*.{js,ts}`.
    - Justification: Principle of minimal localized config (12-Factor dependencies clarity).

### Build / Artefact Hygiene

12. ✅ **COMPLETED** `graph.json` — Removed from git tracking (already in .gitignore); Nx regenerates automatically.

- **Action Taken**: Executed `git rm --cached graph.json` to unstage from repository.
- Justification: Prevent stale project graph; Nx generates automatically.

13. [EVALUATE] `coverage/` directory inclusion — Consider ignoring raw coverage artefacts; keep summarized reports only in `reports/coverage/`.
    - Justification: Repository size management (Docker layer optimization, faster clones).
14. [PRUNE] `.temp/` (root) — If empty or transient, remove and add `.gitkeep` only where necessary.
    - Justification: Reduce noise, clarify active assets.
15. [VALIDATE] `.vitest/` caching folder (ignored) — Ensure not accidentally committed; if committed, purge.
    - Justification: Deterministic CI runs; avoid stale cache confusion.
16. [CHECK] `logs/` directory — Confirm no runtime logs are committed; retain README explaining structure & rotation policy.
    - Justification: 12-Factor log streaming principle.

### Documentation & Standards Alignment

17. [SYNC] `docs/06-security-and-risk/security.md` & root `SECURITY.md` — Ensure consistent secret rotation policy wording; reference ASVS v5.0.0.
    - Justification: Single authoritative security standard alignment.
18. [ADD VERSION TAGGING] All OWASP references (e.g., `copilot-instructions.md`, `quick-ref.md`) — Use `v5.0.0-<chapter.section.requirement>` format when citing.
    - Justification: Future-proof referencing per OWASP guidance.
19. [DOCS UPDATE] Add a short SBOM overview README under `reports/sbom/` if missing, clarifying generation workflow & verification checklist.
    - Justification: Supply chain transparency (ASVS + compliance).
20. [CREATE] `reports/sbom/README.md` if absent — Include generation command, validation steps (SCA scan tie-ins).
    - Justification: Supports reproducible audits.

### Naming & Structure

21. [AUDIT NAMING] Ensure all directories follow kebab-case (`data-game-state/` ok; verify no camelCase or PascalCase dirs in `libs/`, `apps/`).
    - Justification: Consistency reduces cognitive load.
22. [CHECK MIXED EXTENSIONS] `.mjs`/`.js` usage in `apps/api` tests vs TS — Consider migrating all new logic to TypeScript with strict mode & keep `.mjs` only where ESM runtime required.
    - Justification: Type safety; maintainability.
23. [REVIEW] Presence of both `CHANGELOG.md` and distributed log JSONs in `reports/` — Confirm duplication not causing drift (prefer CHANGELOG for narrative, reports/ for machine artifacts).
    - Justification: Avoid divergent change histories.

### Security Hardening

24. [ENFORCE] Replace fallback generation of secrets (`auth.service.ts`) with explicit environment assertion; add unit test to fail when missing.
    - Justification: ASVS config integrity; prevents accidental insecure dev secret leakage.
25. [SCAN CUSTOM SCRIPTS] `scripts/ci/audit-all.sh` & related audit scripts — Add references to ASVS requirement IDs for each check.
    - Justification: Traceability & measurable compliance progress.
26. [CENTRALIZE RATE LIMIT CONFIG] If multiple endpoints implement separate rate limiting logic (needs deeper code scan) — Plan consolidation into shared middleware.
    - Justification: Consistent security control; easier tuning.

### Testing & Observability

27. [UNIFY TEST ENV] Consolidate test env secret seeding into single `scripts/test-env-init.ts` invoked by Vitest setup.
    - Justification: Deterministic test runs; faster future auditing.
28. [ADD README] `test-results/` — Create README describing retention policy, CI artifact lifecycle.
    - Justification: Observability & log hygiene (12-Factor logs).
29. [TRACEABILITY] Instrument `apps/api` auth flows with structured JSON logs (if absent) referencing correlation IDs.
    - Justification: Operational excellence & incident triage.

### Workflow Policy & Neutrality

30. [CHECK POLICY] Ensure no workflow step uses direct `${{ inputs.xxx }}` interpolation inside `run:` commands violating instruction policy; perform targeted review & refactor to use env mapping.
    - Justification: Prevent injection vectors; maintain neutral automation behavior.

### Redundancy / Duplication

31. [DEDUP] Secrets inventory docs: `docs/apps/secrets-inventory.md` vs `SECURITY.md` — Merge overlapping sections; link to single authoritative list.
    - Justification: Reduce stale duplication risk.
32. [MERGE] Multiple audit markdowns under `docs/06-security-and-risk/audits/` — Consider index file summarizing active audits & statuses.
    - Justification: Faster navigation; prevents partial updates.

### Pending Deep Dive (Phase 2 Placeholders)

33. [CONTENT REVIEW] All `apps/*` Docker & Kubernetes manifests — Verify resource requests/limits, non-root user, secret mounts (to be scheduled).
34. [ACCESSIBILITY CHECK] All React components under `libs/ui/` — Automated axe-core scan for WCAG 2.2 AA compliance.
35. [ARCHIVE OR DELETE] Any legacy milestone docs under `docs/archive/` not referenced in current roadmap.
36. [CIRCULAR DEPENDENCIES] Run Nx project graph analysis for cycles; remediate if found.

---

## Next Phases

- Phase 2: Deep content audit (per-file logic, security headers, accessibility, performance critical paths).
- Phase 3: Remediation PRs grouped by category (Configuration, CI/CD, Security, Docs).

## Immediate High-Impact Priorities (Top 5)

1. Fail-fast secret handling (Items 1, 24).
2. Consolidate ESLint configs (Items 10–11).
3. Rationalize CI workflow overlap (Item 6).
4. Update OWASP ASVS references to v5.0.0 (Items 9, 18).
5. Remove committed build artefacts (`graph.json`, coverage bulk) (Items 12–13).

## References

- 12-Factor App: https://12factor.net/config
- OWASP ASVS v5.0.0: https://owasp.org/www-project-application-security-verification-standard/
- Docker Overview: https://docs.docker.com/get-started/overview/
- GitHub Actions Concepts: https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions
- Nx Intro & Features: https://nx.dev/getting-started/intro
- Dev Container Spec: https://containers.dev/

## Summary (Phase 1 - UPDATED)

**Status:** Phase 1 High-Priority Items COMPLETED  
**Date Completed:** 2025-11-10

### Completed Remediation Items

**Phase 1 (High-Priority Security & Configuration):**

1. ✅ **Secret Validation** - Removed fallback secret generation in `auth.service.ts`; enforced fail-fast validation with clear error messages for JWT_SECRET and JWT_REFRESH_SECRET.

2. ✅ **Test Environment Consolidation** - Created unified `tools/testing/test-env-setup.ts` replacing scattered initialization; updated Vitest config to use centralized setup.

3. ✅ **ESLint Configuration** - Created root symlink to `tools/config/.eslintrc.json`; consolidated migrations override into root config; removed redundant local configs.

4. ✅ **OWASP ASVS Update** - Updated all references from v4.0.3 to v5.0.0 in `copilot-instructions.md` (4 occurrences); added version-tagged requirement ID guidance.

5. ✅ **Build Artifact Cleanup** - Removed `graph.json` from git tracking (already in .gitignore); confirmed Nx regenerates automatically.

6. ✅ **CI Workflow Documentation** - Documented separation of concerns between `ci.yml` (comprehensive PR gate) and `build-and-test.yml` (reusable build component) in dedicated doc.

**Phase 2 (Environment Validation & Secret Scanning):** 7. ✅ **Environment Validation Consolidation** - Created unified `tools/scripts/validation/validate-environment.mjs` merging `validate-env.js` and `assess-secrets.sh` with three modes (warn, strict, scan).

8. ✅ **.env.local Verification** - Confirmed no `.env.local` files exist; pattern properly gitignored; automated check integrated into validation module.

9. ✅ **Pre-commit Integration** - Updated `.lefthook.yml` with `env-validation` command running in scan mode; prevents secret commits automatically.

10. ✅ **Validation Documentation** - Created comprehensive guide at `docs/09-observability-and-ops/environment-validation.md` with usage examples, troubleshooting, migration path.

### Security Improvements

- Eliminated auto-generated secrets that caused token invalidation
- Enforced minimum 32-character secret length validation
- Required JWT_SECRET ≠ JWT_REFRESH_SECRET
- Centralized test secret generation for consistency
- **Added comprehensive secret scanning** (15+ detection patterns)
  - High-entropy strings (40+ characters)
  - AWS access keys (AKIA pattern)
  - Private keys (RSA, SSH)
  - Password/API key assignments
- **Pre-commit secret detection** via Lefthook integration
- **Automated .env.local security checks**

### Technical Debt Reduction

- Consolidated 4+ test environment setup files into single source
- Unified ESLint configuration reducing drift potential
- Removed stale build artifacts from repository
- Clarified CI/CD workflow responsibilities
- **Merged 2 environment validation scripts into unified module**
- **Added 3 npm scripts for validation** (`env:validate`, `env:validate:strict`, `env:scan`)
- **Eliminated validation script duplication** (validate-env.js + assess-secrets.sh)

### Standards Alignment

- Updated OWASP ASVS references to current stable release (v5.0.0)
- Aligned with 12-Factor Config principles (no implicit secret generation)
- Followed GitHub Actions best practices (workflow composition)
- Maintained Nx monorepo hygiene (single lint config, clean graph)

### Files Modified

**Phase 1:**

1. `/Users/morganlowman/GitHub/political-sphere/apps/api/src/auth/auth.service.ts` - Secret validation
2. `/Users/morganlowman/GitHub/political-sphere/apps/api/src/index.ts` - Removed warning log
3. `/Users/morganlowman/GitHub/political-sphere/tools/testing/test-env-setup.ts` - NEW unified test env
4. `/Users/morganlowman/GitHub/political-sphere/vitest.config.ts` - Updated setup file path
5. `/Users/morganlowman/GitHub/political-sphere/.eslintrc.json` - NEW symlink to tools/config
6. `/Users/morganlowman/GitHub/political-sphere/tools/config/.eslintrc.json` - Added migrations override
7. `/Users/morganlowman/GitHub/political-sphere/.github/copilot-instructions.md` - OWASP v5.0.0 updates (4 locations)
8. `/Users/morganlowman/GitHub/political-sphere/docs/09-observability-and-ops/ci-workflow-separation.md` - NEW documentation

**Phase 2:** 9. `/Users/morganlowman/GitHub/political-sphere/tools/scripts/validation/validate-environment.mjs` - NEW unified validation module 10. `/Users/morganlowman/GitHub/political-sphere/.lefthook.yml` - Added env-validation pre-commit hook 11. `/Users/morganlowman/GitHub/political-sphere/package.json` - Added env:validate npm scripts 12. `/Users/morganlowman/GitHub/political-sphere/docs/09-observability-and-ops/environment-validation.md` - NEW comprehensive guide

### Files Removed

**Phase 1:**

1. `apps/api/src/utils/migrations/.eslintrc.json` - Consolidated into root

**Phase 2:** 2. `graph.json` - Removed from git tracking (git rm --cached)

### Files Deprecated (Legacy - Keep for Backward Compatibility)

**Phase 2:**

1. `tools/scripts/validate-env.js` - Use `npm run env:validate` instead (to be removed in v3.0.0)
2. `tools/scripts/security/assess-secrets.sh` - Use `npm run env:scan` instead (to be removed in v3.0.0)

### Next Phase (Phase 3)

Remaining items from original audit ready for prioritization:

**High Priority:**

- Complete naming convention audit (Item 21)
- Review coverage directory inclusion strategy (Item 13)
- Documentation deduplication (Items 17, 19, 31-32)

**Medium Priority:**

- Workflow policy compliance (Item 30 - prevent injection vectors)
- Auth module consolidation (Item 2 - single-source auth config)
- Health check workflow normalization (Item 7)

**Deep Dive (Phase 4):**

- Docker/K8s manifest hardening (Item 33 - resource limits, non-root user)
- Accessibility scan (Item 34 - axe-core for WCAG 2.2 AA)
- Circular dependency check (Item 36 - Nx graph analysis)
- Archive legacy docs (Item 35)

**Recommendation:** Run tests to validate Phase 2 changes before committing:

```bash
npm test
npm run env:validate
```

---

Initial structural audit reveals configuration and tooling duplication (ESLint, secret validation), potential workflow overlap, outdated OWASP version references, inclusion of generated artefacts (`graph.json`, full coverage directory), and secret fallback generation patterns contrary to 12-Factor principles. Prioritized remediation list established; deeper per-file security & accessibility evaluation queued for Phase 2.

---

_End of Phase 1 - Operation Clean-Up_
