# PR Quality Gates Configuration

## Required Status Checks

Configure these as required status checks in GitHub repository settings:

**Settings → Branches → Branch protection rules → Require status checks to pass**

### Constitutional Gates (MUST PASS - Block Merge)

These checks enforce constitutional requirements and cannot be bypassed:

1. **political-neutrality** (from ai-governance.yml)
   - Purpose: Ensure democratic neutrality
   - Failure: Blocks merge - political bias detected
   - Override: Requires TGC approval + ADR documentation

2. **nist-ai-rmf-compliance** (from ai-governance.yml)
   - Purpose: AI governance framework compliance
   - Failure: Blocks merge - AI system registration issue
   - Override: Not permitted without governance review

3. **validation-gate-tests** (from ai-governance.yml)
   - Purpose: 3-tier validation (Constitutional, Mandatory, Best-practice)
   - Failure: Blocks merge - constitutional validation failed
   - Override: Not permitted for Tier 0 failures

### Mandatory Gates (MUST PASS - Block Merge)

These checks enforce quality and security standards:

4. **change-budget-validation** (from ai-governance.yml)
   - Purpose: Enforce change budget limits per execution mode
   - Failure: Blocks merge - PR exceeds change budget
   - Override: Switch to higher execution mode or split PR

5. **test** (from ci.yml)
   - Purpose: All tests passing, 80%+ coverage maintained
   - Failure: Blocks merge - failing tests or coverage drop
   - Override: Not permitted without fixing tests

6. **lint-typecheck** (from ci.yml)
   - Purpose: Code quality and type safety
   - Failure: Blocks merge - linting errors or type errors
   - Override: Not permitted without fixing issues

7. **security-scan** (from security-scan.yml)
   - Purpose: No critical/high vulnerabilities
   - Failure: Blocks merge - security vulnerabilities found
   - Override: Requires security team approval + mitigation plan

8. **accessibility** (from accessibility.yml)
   - Purpose: WCAG 2.2 AA compliance for UI changes
   - Failure: Blocks merge - accessibility violations
   - Override: Not permitted without fixing violations

### Best-Practice Gates (SHOULD PASS - Warning Only)

These checks provide feedback but don't block merge:

9. **semantic-quality-check** (from ai-governance.yml)
   - Purpose: Code quality analysis and pattern consistency
   - Failure: Warning - code quality concerns flagged
   - Action: Review feedback, improve if feasible

10. **competence-assessment** (from ai-governance.yml)
    - Purpose: AI-assisted code quality trends
    - Failure: Warning - competence score below target
    - Action: Review AI-generated code, improve tests

11. **context-quality-check** (from ai-governance.yml)
    - Purpose: AI context bundle freshness
    - Failure: Warning - context bundles outdated
    - Action: Run `npm run ai:refresh`

12. **visual-regression** (from visual-regression.yml)
    - Purpose: Detect unintended UI changes
    - Failure: Warning - visual changes detected
    - Action: Review screenshots, update baselines if intentional

---

## GitHub Configuration Steps

### 1. Enable Branch Protection

```bash
# Via GitHub CLI
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=political-neutrality \
  --field required_status_checks[contexts][]=nist-ai-rmf-compliance \
  --field required_status_checks[contexts][]=validation-gate-tests \
  --field required_status_checks[contexts][]=change-budget-validation \
  --field required_status_checks[contexts][]=test \
  --field required_status_checks[contexts][]=lint-typecheck \
  --field required_status_checks[contexts][]=security-scan \
  --field required_status_checks[contexts][]=accessibility \
  --field enforce_admins=true \
  --field required_pull_request_reviews[required_approving_review_count]=1
```

### 2. Configure CODEOWNERS

Add to `.github/CODEOWNERS`:

```
# AI System Changes
/tools/scripts/ai/                  @lead-developer @ai-system-steward
/.github/workflows/ai-*.yml         @lead-developer @tgc-members
/docs/07-ai-and-simulation/         @tgc-members

# Governance Documents
/docs/02-governance/                @tgc-members
/.github/copilot-instructions.md    @tgc-members

# Security Critical
/apps/api/src/middleware/auth.js    @security-team @lead-developer
/libs/platform/auth/                @security-team
```

### 3. Add Status Check Labels

Auto-label PRs based on check failures:

```yaml
# .github/labeler.yml additions
'ai-validation-failure':
  - any: ['ci-status:failure:ai-governance']

'security-vulnerability':
  - any: ['ci-status:failure:security-scan']

'accessibility-issue':
  - any: ['ci-status:failure:accessibility']

'needs-tests':
  - any: ['ci-status:failure:test']
```

---

## Quality Gate Enforcement Matrix

| Gate | Severity | Block Merge | Override Path | Escalation |
|------|----------|-------------|---------------|------------|
| political-neutrality | Constitutional | ✅ Yes | TGC + ADR | P0 - Immediate |
| nist-ai-rmf-compliance | Constitutional | ✅ Yes | TGC Review | P0 - Same Day |
| validation-gate-tests | Constitutional | ✅ Yes | Not Permitted | P0 - Immediate |
| change-budget-validation | Mandatory | ✅ Yes | Mode Switch/Split PR | P2 - Week |
| test | Mandatory | ✅ Yes | Fix Required | P1 - Same Day |
| lint-typecheck | Mandatory | ✅ Yes | Fix Required | P1 - Same Day |
| security-scan | Mandatory | ✅ Yes | Security Team | P0 - Immediate |
| accessibility | Mandatory | ✅ Yes | Fix Required | P1 - Same Day |
| semantic-quality-check | Best-Practice | ❌ No | N/A | P3 - Best Effort |
| competence-assessment | Best-Practice | ❌ No | N/A | P2 - Monitor |
| context-quality-check | Best-Practice | ❌ No | N/A | P3 - Best Effort |
| visual-regression | Best-Practice | ❌ No | Update Baselines | P2 - Week |

---

## Override Request Process

**For Mandatory Gates (Tier 1):**

1. Create override request issue: `.github/ISSUE_TEMPLATE/quality-gate-override.md`
2. Document justification and risk mitigation
3. Obtain required approvals (per matrix above)
4. Apply temporary bypass label: `override:quality-gate`
5. Schedule remediation in next sprint
6. Remove override after fix deployed

**For Constitutional Gates (Tier 0):**

1. **Cannot override without governance approval**
2. Escalate to TGC immediately
3. Create incident report
4. Document in ADR if pattern change needed
5. Fix before merge - no exceptions

---

## Monitoring Quality Gates

### Dashboard Metrics

**Track in Grafana:**
- Gate pass/fail rates by type
- Time-to-fix for gate failures
- Override frequency (should be <1% of PRs)
- Recurring failure patterns

**Alerts:**
- Constitutional gate failures → PagerDuty
- >10% PRs failing same gate in 24h → TGC notification
- Override rate >2% → Governance review

### Monthly Review

**TGC Reviews:**
- Gate effectiveness (catching real issues vs false positives)
- Override rate and justifications
- Patterns in failures (indicates training/tooling gaps)
- Threshold adjustments needed

---

## Developer Guidance

### Before Creating PR

```bash
# Run local validation
npm run preflight        # Linting, type-check, basic tests
npm run test:changed     # Run tests for changed files
npm run ai:refresh       # Update AI context
```

### During PR Review

**If Gate Fails:**

1. Check workflow logs for specific failure
2. Review gate-specific troubleshooting:
   - political-neutrality → See ai-system-usage-guide.md
   - test → Run locally with `npm test`
   - security-scan → Review Semgrep/Snyk reports
   - accessibility → Run `npm run test:accessibility`

3. Fix and push updates
4. Re-run failed checks: Comment `/rerun <check-name>` (if configured)

**If All Gates Pass:**

- Wait for 1 approving review (per branch protection)
- Squash and merge (preferred) or merge commit
- Delete feature branch after merge

### Emergency Bypass (Rare)

**Criteria:**
- Production outage or security incident
- Fix cannot wait for normal process
- Must be constitutional-compliant

**Process:**
1. Create emergency incident
2. Apply `emergency-merge` label
3. Document bypass justification
4. Obtain on-call approval
5. Merge with override
6. **Create follow-up PR within 24h** to address skipped checks
7. Post-incident review required

---

## Configuration Files

### Required Status Checks JSON (for GitHub API)

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "political-neutrality",
      "nist-ai-rmf-compliance",
      "validation-gate-tests",
      "change-budget-validation",
      "test",
      "lint-typecheck",
      "security-scan",
      "accessibility"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

### Apply via API

```bash
curl -X PUT \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/PoliticalSphere/political-sphere/branches/main/protection \
  -d @branch-protection.json
```

---

## Related Documentation

- **AI Governance:** `docs/07-ai-and-simulation/ai-governance.md`
- **AI System Usage:** `docs/05-engineering-and-devops/ai-system-usage-guide.md`
- **AI Maintenance SOP:** `docs/05-engineering-and-devops/sops/ai-maintenance-sop.md`
- **Copilot Instructions:** `.github/copilot-instructions.md`

---

**Last Updated:** 2025-11-14  
**Next Review:** 2025-12-14  
**Owner:** Technical Governance Committee
