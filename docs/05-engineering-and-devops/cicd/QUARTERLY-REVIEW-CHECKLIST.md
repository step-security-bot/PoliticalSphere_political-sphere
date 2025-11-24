# Quarterly CI/CD Review Checklist

**Purpose:** Ensure CI/CD pipeline remains efficient, secure, and cost-effective  
**Frequency:** Quarterly (every 3 months)  
**Next Review:** [Add date]

## Performance Metrics

- [ ] **Success Rate**: ≥95% across all workflows
  - Current: \_\_\_% (Target: 95%)
- [ ] **P95 Duration**: CI pipeline <20 minutes
  - Current: \_\_\_ min (Target: 20 min)
- [ ] **Cache Hit Rate**: ≥80% for all caches
  - npm: \_\_\_% (Target: 80%)
  - Nx: \_\_\_% (Target: 80%)
  - Playwright: \_\_\_% (Target: 90%)

## Cost Analysis

- [ ] **Monthly Spend**: <$300/month
  - Current: $\_\_\_ (Target: $300)
- [ ] **Cost per PR**: <$0.50/PR
  - Current: $\_\_\_ (Target: $0.50)
- [ ] **Optimization Opportunities**: Identified and prioritized
  - [ ] Nx Cloud DTE evaluation
  - [ ] Self-hosted runner analysis
  - [ ] Workflow consolidation

## Security Posture

- [ ] **SLSA Level 3**: Maintained
  - [ ] Provenance generation working
  - [ ] Artifact signing functional
  - [ ] SBOM generation up-to-date
- [ ] **Workflow Permissions**: Least-privilege model enforced
  - [ ] Audit script passing (>90% compliance)
  - [ ] No `write-all` permissions
- [ ] **Dependency Security**: No high/critical vulnerabilities
  - [ ] npm audit passing
  - [ ] Snyk scan passing
  - [ ] License compliance verified

## Observability

- [ ] **Metrics Collection**: Functioning correctly
  - [ ] Dashboard generated weekly
  - [ ] Alerts configured and tested
  - [ ] SLO tracking active
- [ ] **Failure Analytics**: Trends identified
  - [ ] Flaky tests categorized
  - [ ] Root causes documented
  - [ ] Remediation plans created

## Developer Experience

- [ ] **Feedback Speed**: <5 minutes for PR validation
  - Current: \_\_\_ min (Target: 5 min)
- [ ] **Local Tooling**: Up-to-date and documented
  - [ ] `act` for local CI emulation
  - [ ] Fast feedback script
  - [ ] Pre-commit hooks
- [ ] **Documentation**: Current and comprehensive
  - [ ] ADRs updated
  - [ ] Runbooks reviewed
  - [ ] Team trained on new features

## Action Items

### High Priority

1. ---
2. ---
3. ---

### Medium Priority

1. ---
2. ---

### Low Priority

1. ---

## Review Sign-Off

- **Date:** **\*\***\_\_\_**\*\***
- **Reviewed By:** **\*\***\_\_\_**\*\***
- **Next Review:** **\*\***\_\_\_**\*\*** (3 months from today)
- **Status:** ☐ PASS ☐ PASS WITH ACTIONS ☐ FAIL

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

_Last Updated: 2025-11-18_
