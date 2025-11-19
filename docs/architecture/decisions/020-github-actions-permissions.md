# ADR-020: GitHub Actions Least-Privilege Permission Model

**Status:** Accepted  
**Date:** 2025-11-18  
**Deciders:** Platform Engineering, Security Team  
**Tags:** security, ci-cd, owasp, github-actions

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Context and Problem Statement

GitHub Actions workflows in Political Sphere were using inconsistent permission models, with some workflows having overly permissive `GITHUB_TOKEN` access (`write-all` or broad write permissions at the top level). This violates the principle of least privilege and increases the attack surface for supply chain attacks.

**Security Risks:**

- **OWASP CICD-SEC-2 (Inadequate Identity and Access Management):** Overprivileged tokens can be exploited by compromised actions or malicious code injection
- **Credential Escalation:** An attacker gaining control of a workflow could exfiltrate secrets or modify repository contents
- **Supply Chain Attacks:** Compromised third-party actions with excessive permissions can abuse trust relationships

**Reference:** [OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/)

## Decision Drivers

1. **Security Compliance:** Align with OWASP CICD-SEC-2 and GitHub Security Best Practices
2. **Least Privilege Principle:** Grant only the minimum permissions required for each job
3. **Auditability:** Make permission grants explicit and reviewable
4. **Maintainability:** Establish clear patterns for future workflow creation
5. **Defense in Depth:** Minimize blast radius of compromised workflows

## Considered Options

### Option 1: Keep Current Mixed Approach

- **Pros:** No immediate work required
- **Cons:** Security vulnerability, non-compliant with OWASP standards, inconsistent patterns

### Option 2: Set All Workflows to `write-all`

- **Pros:** Simple, no breakage
- **Cons:** Maximum security risk, violates least privilege, regulatory non-compliance

### Option 3: Least-Privilege Model (SELECTED)

- **Pros:** Secure, compliant, auditable, follows industry best practices
- **Cons:** Requires initial audit and remediation effort

## Decision Outcome

**Chosen option:** Option 3 - Implement Least-Privilege Permission Model across all GitHub Actions workflows.

### Implementation Pattern

```yaml
# Top-level: Read-only by default
permissions:
  contents: read

jobs:
  # Job with read-only operations
  lint:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@<sha>
      - run: npm run lint

  # Job requiring write permissions
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write # Explicitly grant write access
      packages: write # Only for package publishing
    steps:
      - uses: actions/checkout@<sha>
      - run: npm publish
```

### Permission Mapping by Workflow Type

| Workflow Type                                   | Top-Level        | Job-Level Additions                       | Justification                  |
| ----------------------------------------------- | ---------------- | ----------------------------------------- | ------------------------------ |
| **CI/CD** (ci.yml, test.yml)                    | `contents: read` | `pull-requests: write` (comment job only) | Post test results to PRs       |
| **Security** (security.yml, codeql.yml)         | `contents: read` | `security-events: write` (SARIF upload)   | Upload security findings       |
| **Release** (release.yml)                       | `contents: read` | `contents: write`, `packages: write`      | Create tags, publish artifacts |
| **Dependency Updates** (dependency-updates.yml) | `contents: read` | `pull-requests: write`                    | Dependabot PR creation         |
| **Read-Only** (e2e.yml, accessibility.yml)      | `contents: read` | None                                      | No state-changing operations   |

### Enforcement Mechanisms

1. **Pre-commit Validation:** Lefthook hook validates workflow permissions
2. **CI Validation:** GitHub Actions linter (actionlint) enforces pattern
3. **Audit Script:** `scripts/ci/audit-permissions.sh` for periodic review
4. **Code Review:** CODEOWNERS require security team review for workflow changes

## Consequences

### Positive

- ✅ **Reduced Attack Surface:** Compromised workflows can't escalate privileges
- ✅ **OWASP Compliance:** Addresses CICD-SEC-2 risk
- ✅ **Explicit Permissions:** Clear documentation of what each job can do
- ✅ **Audit Trail:** Easier to track permission grants in git history
- ✅ **Future-Proofing:** Pattern established for new workflows

### Negative

- ⚠️ **Initial Effort:** Required audit and update of 28 workflows
- ⚠️ **Maintenance Overhead:** New workflows require permission consideration
- ⚠️ **Potential Breakage:** Incorrect permission grants may cause failures (mitigated by testing)

### Neutral

- 📊 **No Performance Impact:** Permission model doesn't affect runtime
- 📋 **Documentation Burden:** Requires explanation for contributors

## Validation and Acceptance Criteria

**Phase 1 Completion Criteria:**

- [ ] All 28 workflows updated with top-level `permissions: contents: read` or `read-all`
- [ ] Job-level permissions granted only where needed
- [ ] Zero workflows use `write-all` at any level
- [ ] StepSecurity audit score ≥ 95/100
- [ ] All workflows tested in feature branch before merge
- [ ] No workflow execution regressions for 7 days

**Ongoing Validation:**

- [ ] Monthly permission audits with `scripts/ci/audit-permissions.sh`
- [ ] Security team review required for all workflow changes
- [ ] Quarterly review of permission grants vs. actual usage

## Implementation Details

### Remediation Steps

1. **Audit Phase** (Completed 2025-11-18)
   - Ran `scripts/ci/audit-permissions.sh`
   - Identified 2 non-compliant workflows: `release.yml`, `codeql.yml`

2. **Remediation Phase** (Completed 2025-11-18)
   - Updated `release.yml`: Set top-level to `contents: read`, job-level grants as needed
   - Updated `codeql.yml`: Set top-level to `contents: read`, maintained `security-events: write` at job level
   - Added top-level permissions to `ci.yml`: `contents: read`

3. **Validation Phase** (In Progress)
   - Test workflows in feature branch
   - Monitor for permission-related failures
   - Re-run audit to confirm 100% compliance

### StepSecurity Integration

For enhanced security, critical workflows integrate StepSecurity Harden-Runner:

```yaml
jobs:
  critical-job:
    runs-on: ubuntu-latest
    steps:
      - uses: step-security/harden-runner@v2
        with:
          egress-policy: audit # Monitor network egress
          allowed-endpoints: |
            github.com:443
            api.github.com:443
            objects.githubusercontent.com:443
```

**Harden-Runner Benefits:**

- Detects outbound network calls to unexpected domains
- Prevents credential exfiltration
- Provides forensic evidence for security incidents

### Rollback Plan

If permission changes cause workflow failures:

1. **Immediate:** Revert specific workflow to previous version
2. **Temporary:** Add `write-all` with inline comment justifying exception
3. **Fix Forward:** Identify required permissions, update workflow, re-test
4. **Documentation:** Record issue in ADR amendments section

## References

- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/)
- [StepSecurity Hardening Guide](https://github.com/step-security/harden-runner)
- [Microsoft Learn - GitHub Advanced Security](https://learn.microsoft.com/en-us/azure/devops/pipelines/security/github-advanced-security)
- [CNCF TAG Security - Supply Chain Best Practices](https://github.com/cncf/tag-security/blob/main/supply-chain-security/supply-chain-security-paper/sscsp.md)

## Related ADRs

- ADR-001: GitHub Actions as CI Platform
- ADR-021: Distributed Task Execution with Nx Cloud (Planned)
- ADR-022: CI/CD Observability with Grafana (Planned)
- ADR-023: Artifact Signing with Sigstore (Planned)

---

## Amendments

### 2025-11-18 - Initial Implementation

- Created ADR documenting least-privilege permission model
- Updated 3 critical workflows (release.yml, codeql.yml, ci.yml)
- Deployed permission audit script (`scripts/ci/audit-permissions.sh`)

---

**Document Control:**

- **Version:** 1.0.0
- **Last Updated:** 2025-11-18
- **Next Review:** 2025-12-18
- **Owner:** Platform Engineering
- **Classification:** Internal Use Only
