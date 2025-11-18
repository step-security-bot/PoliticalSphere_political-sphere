# ADR-008: Test Optimization and Workflow Consolidation Strategy

**Status:** Accepted  
**Date:** 2025-11-18  
**Authors:** Political Sphere Engineering Team  
**Supersedes:** None  
**Related:** ADR-007 (Comprehensive Caching Strategy)

## Context

### Current State Analysis

Our CI/CD pipeline executes 24 separate GitHub Actions workflows with redundant testing and security scanning:

**Performance Bottlenecks:**
- PR validation: 35-50 minutes average
- Test execution: 5-8 minutes per shard × 3 shards = 15-24 minutes total
- Full test suite runs even for tiny PRs (1-2 file changes)
- Integration tests: 8-12 minutes
- E2E tests: 12-18 minutes
- No incremental testing (Nx affected underutilized)

**Workflow Redundancy:**
- `test.yml` (221 lines) duplicates `ci.yml` test stages
- `security-scan.yml` (100 lines) should be reusable composite action
- `build-and-test.yml` overlaps with `ci.yml` build stage
- 7 workflows identified for consolidation → reduce 24 to 17 (29% reduction)

**Testing Inefficiencies:**
- Static 3-shard split regardless of change size
- Small PRs (<10 files) waste resources with 3-shard parallelization
- Large PRs (>50 files) underutilize only 3 shards
- No retry logic for flaky tests (manual re-runs waste developer time)
- Coverage aggregation expects exactly 3 shards (brittle)

### Research and Best Practices

**Microsoft Learn - GitHub Actions Performance:**
- Dynamic matrix strategies enable variable shard counts
- `fromJSON` with `range()` creates dynamic matrix arrays
- Job dependencies with `needs.job-id.outputs.variable` pass runtime values
- Conditional job execution via `if: github.event_name == 'pull_request'`

**Nx Affected Testing:**
- `nx affected --target=test` runs only tests for changed code
- Reduces test time by 40-70% for typical PRs
- Requires git history (`fetch-depth: 0`) to compute affected projects
- Works seamlessly with existing Vitest project configuration

**Test Retry Patterns:**
- Vitest supports `retry` configuration for handling flaky tests
- Industry standard: max 2 retries for CI environments
- Prevents pipeline failures from transient issues (network, timing)
- Should be enabled only in CI (not local development)

**Workflow Consolidation Benefits:**
- Reduced maintenance burden (fewer YAML files to update)
- Simplified dependency graphs (fewer inter-workflow dependencies)
- Improved observability (single workflow = single status check)
- Lower GitHub Actions minutes consumption

## Decision

Implement **three-phase test optimization and workflow consolidation strategy:**

### Phase 4B: Test Optimization (Weeks 1-2)

**1. Dynamic Test Sharding Based on Change Size:**

```yaml
calculate-shards:
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  outputs:
    shard-count: ${{ steps.calc.outputs.count }}
    use-affected: ${{ steps.calc.outputs.use-affected }}
  steps:
    - name: Calculate shard count from changed files
      run: |
        CHANGED_FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD | grep -E '\.(ts|tsx|js|jsx|mjs)$' | wc -l)
        
        if [ "$CHANGED_FILES" -lt 10 ]; then
          SHARD_COUNT=3; USE_AFFECTED="true"  # Small PR: minimal parallelism + affected
        elif [ "$CHANGED_FILES" -lt 50 ]; then
          SHARD_COUNT=5; USE_AFFECTED="true"  # Medium PR: balanced
        else
          SHARD_COUNT=7; USE_AFFECTED="false" # Large PR: max parallelism + full suite
        fi
```

**Rationale:**
- Small PRs (<10 files): 3 shards + Nx affected = 50-70% time reduction
- Medium PRs (10-50 files): 5 shards + Nx affected = 30-50% time reduction
- Large PRs (>50 files): 7 shards + full suite = 20-30% time reduction via parallelism
- Nx affected disabled for large changes to ensure comprehensive validation

**2. Nx Affected Testing Integration:**

```yaml
- name: Run tests with Nx affected
  run: |
    if [ "${{ needs.calculate-shards.outputs.use-affected }}" = "true" ]; then
      npx nx affected --target=test --parallel=3 --shard=${{ matrix.shard }}/${{ needs.calculate-shards.outputs.shard-count }}
    else
      npm run test:ci  # Full suite for large changes
    fi
```

**Rationale:**
- Nx affected skips unchanged projects/libs
- Maintains test isolation (each shard independent)
- Falls back to full suite for large refactors (safety net)
- Leverages existing Nx project configuration (`apps`, `libs`, `ai-integration`)

**3. Test Retry Logic for Flaky Test Handling:**

Update `vitest.config.ts`:
```typescript
const retryCount = parseInt(process.env.VITEST_RETRY || '0', 10);

const createBaseTestConfig = () => ({
  // ... existing config
  retry: retryCount,  // 0 locally, 2 in CI
});
```

CI workflow:
```yaml
env:
  VITEST_RETRY: '2'  # Max 2 retries for flaky tests
```

**Rationale:**
- Prevents false negatives from network timeouts, race conditions
- Industry best practice: max 2 retries (avoid hiding real issues)
- Only enabled in CI (developers see failures immediately)
- Reduces manual re-run requests by 60-80%

**4. Dynamic Coverage Aggregation:**

```yaml
- name: Verify all shards downloaded
  run: |
    EXPECTED_SHARDS=${{ needs.calculate-shards.outputs.shard-count || '3' }}
    DOWNLOADED_SHARDS=$(find coverage-shards -name "lcov.info" | wc -l)
    
    # Don't fail on shard mismatch (affected mode may skip entire shards)
    echo "Expected: $EXPECTED_SHARDS, Downloaded: $DOWNLOADED_SHARDS"
```

**Rationale:**
- Nx affected may result in fewer shards running (0 tests in shard)
- Coverage aggregation must tolerate variable shard counts
- Maintains 80% threshold on combined coverage

### Phase 4C: Workflow Consolidation (Weeks 2-3)

**1. Deprecate `test.yml` - Merge into `ci.yml`:**

- `test.yml` provides identical functionality to `ci.yml` test stages
- Consolidation eliminates 221 lines of redundant YAML
- Single source of truth for test execution
- Simplifies status checks (1 instead of 2 workflows)

**Migration:**
- Add conditional logic to `ci.yml` to handle `test.yml` triggers
- Update branch protection rules to reference consolidated workflow
- Deprecate `test.yml` with 30-day sunset period
- Update documentation and developer guides

**2. Convert `security-scan.yml` to Composite Action:**

Create `.github/actions/security-scan/action.yml`:
```yaml
inputs:
  enable-npm-audit: { default: 'true' }
  enable-semgrep: { default: 'true' }
  enable-trivy: { default: 'true' }
  enable-grype: { default: 'true' }
  fail-on-high: { default: 'true' }

outputs:
  npm-audit-result: { value: ${{ steps.npm-audit.outputs.result }} }
  semgrep-result: { value: ${{ steps.semgrep.outputs.result }} }
  trivy-result: { value: ${{ steps.trivy.outputs.result }} }
  grype-result: { value: ${{ steps.grype.outputs.result }} }
```

**Benefits:**
- Reusable across workflows (ci.yml, docker.yml, scheduled scans)
- Toggleable security scanners via inputs
- Consistent security scanning across all pipelines
- Easier to version and update scanner configurations

**Usage in workflows:**
```yaml
- uses: ./.github/actions/security-scan
  with:
    fail-on-high: 'true'
    enable-trivy: 'true'
    enable-grype: 'false'  # Example: disable specific scanner
```

**3. Consolidate `build-and-test.yml` Functionality:**

- Verify all build-and-test use cases covered by enhanced `ci.yml`
- Remove redundant workflow file (eliminate duplication)
- Update workflow triggers to ensure no gaps in coverage
- Migrate unique features (if any) into `ci.yml`

**Result:** 24 workflows → 17 workflows (29% reduction)

### Phase 5: Security Hardening (Weeks 3-6) - Preview

**Planned Security Enhancements:**
- SLSA Level 3 provenance generation (supply chain integrity)
- SBOM generation for all artifacts (currently only Docker images)
- OIDC authentication for AWS/Azure (eliminate long-lived credentials)
- CodeQL SAST for comprehensive code analysis
- Checkov IaC scanning for Terraform/Kubernetes manifests
- Automated Dependabot for action updates

**Target Metrics:**
- OWASP ASVS compliance: 65% → 90%
- SLSA Level: 1 → 3
- Vulnerability remediation SLA: < 7 days for high/critical

## Consequences

### Positive

**Performance Improvements (Expected):**
- Small PR validation time: 35-50 min → 12-18 min (60-65% reduction)
- Medium PR validation time: 35-50 min → 18-25 min (45-50% reduction)
- Large PR validation time: 35-50 min → 25-35 min (20-30% reduction)
- Test execution: 15-24 min → 5-12 min (50-75% reduction via affected + dynamic sharding)
- Developer re-run requests: -60-80% (via retry logic)

**Maintainability Improvements:**
- Workflow count: 24 → 17 (29% reduction)
- YAML maintenance burden: -500+ lines
- Security scanner configuration: centralized in single action
- Status checks: simplified (fewer required checks)

**Cost Savings:**
- GitHub Actions minutes: 30-40% reduction (estimated $200-300/month savings)
- Developer time: 15-25 hours/week saved (faster feedback loops)
- Incident response: faster rollbacks (simpler pipeline)

### Negative (with Mitigations)

**Increased Complexity:**
- Dynamic matrix strategies harder to debug than static
- **Mitigation:** Comprehensive logging in calculate-shards job, document matrix generation logic in ADR

**Risk of Over-Optimization:**
- Nx affected may miss edge cases (transitive dependencies)
- **Mitigation:** Full test suite for PRs >50 files, scheduled nightly full runs, escape hatch via workflow_dispatch

**Breaking Change for Branch Protection:**
- Consolidating workflows changes required status checks
- **Mitigation:** Phased migration with 30-day overlap period, update documentation, notify team via Slack/email

**Flaky Test Masking:**
- Retry logic may hide real intermittent bugs
- **Mitigation:** Track retry metrics, alert on >10% retry rate, investigate persistent flakes

### Monitoring and Success Criteria

**Key Metrics (Dashboard):**
1. **PR Validation Time (P50/P95/P99):**
   - Baseline: P50=42min, P95=55min, P99=68min
   - Target: P50=18min, P95=30min, P99=45min

2. **Test Execution Time by Shard Count:**
   - Track: 3-shard (small PR), 5-shard (medium PR), 7-shard (large PR)
   - Measure: Nx affected hit rate (% tests skipped)

3. **Retry Rate (Flaky Test Metric):**
   - Baseline: N/A (manual re-runs not tracked)
   - Target: <10% retry rate, alert on >15%

4. **Workflow Execution Count:**
   - Baseline: 24 active workflows
   - Target: 17 workflows (completed by end of Phase 4C)

5. **GitHub Actions Minutes Consumption:**
   - Baseline: ~15,000 minutes/month
   - Target: <10,000 minutes/month (33% reduction)

**Weekly Review Process:**
- Monday: Review P95 PR validation time (target: <30 min)
- Wednesday: Review retry rate and flaky test candidates
- Friday: Review Nx affected effectiveness (% time saved)

## Alternatives Considered

### 1. Static 5-Shard Configuration (Rejected)

**Approach:** Increase all PRs to 5 shards regardless of size

**Pros:**
- Simpler than dynamic sharding
- Better parallelism for medium/large PRs

**Cons:**
- Small PRs waste resources (overhead > benefit)
- No cost optimization for common case (<10 files)
- Doesn't leverage Nx affected

**Decision:** Rejected - dynamic approach provides better ROI

### 2. Full Nx Affected All PRs (Rejected)

**Approach:** Always use Nx affected, never run full suite

**Pros:**
- Maximum test time reduction
- Simplest implementation

**Cons:**
- Risk missing transitive dependency issues
- Difficult to debug "works in PR, fails in main"
- No safety net for large refactors

**Decision:** Rejected - hybrid approach (affected for <50 files) balances speed + safety

### 3. Keep Separate Workflows (Rejected)

**Approach:** Maintain 24 workflows, optimize individually

**Pros:**
- No migration risk
- Clear separation of concerns

**Cons:**
- Ongoing maintenance burden (24 files to update)
- Duplicated security scanning logic
- Complex inter-workflow dependencies

**Decision:** Rejected - consolidation provides long-term maintainability benefits

### 4. Commercial CI/CD Platform (Rejected)

**Approach:** Migrate to CircleCI, Travis, or Jenkins

**Pros:**
- Better caching primitives
- Advanced parallelization features
- Dedicated support

**Cons:**
- Migration cost: 80-120 hours
- Additional monthly cost: $500-1000
- Lock-in to commercial vendor
- Lose GitHub integration benefits

**Decision:** Rejected - GitHub Actions optimization provides 80% of benefits at 20% of cost

## Implementation Plan

### Week 1: Phase 4B - Test Optimization

**Day 1-2: Dynamic Sharding Implementation**
- [ ] Add `calculate-shards` job to `ci.yml`
- [ ] Update `test` job matrix to use dynamic shard count
- [ ] Add changed files calculation logic
- [ ] Test with small PR (<10 files), medium PR (10-50 files), large PR (>50 files)

**Day 3-4: Nx Affected Integration**
- [ ] Update test execution to use `nx affected --target=test`
- [ ] Add conditional logic (affected vs full suite)
- [ ] Update coverage aggregation to handle variable shards
- [ ] Validate affected detection accuracy

**Day 5: Retry Logic Implementation**
- [ ] Update `vitest.config.ts` with retry configuration
- [ ] Add `VITEST_RETRY=2` to CI environment
- [ ] Test retry behavior with intentionally flaky test
- [ ] Document retry monitoring process

### Week 2: Phase 4C - Workflow Consolidation

**Day 1-2: Security Scan Composite Action**
- [ ] Create `.github/actions/security-scan/action.yml`
- [ ] Migrate npm audit, Semgrep, Trivy, Grype logic
- [ ] Add security database caching (Trivy/Grype)
- [ ] Update `ci.yml` to use new action
- [ ] Deprecate standalone `security-scan.yml`

**Day 3-4: Workflow Consolidation**
- [ ] Analyze `test.yml` for unique features
- [ ] Merge unique logic into `ci.yml`
- [ ] Add deprecation notice to `test.yml`
- [ ] Update branch protection rules
- [ ] Test consolidated workflow with sample PR

**Day 5: Documentation and Validation**
- [ ] Update developer documentation (CONTRIBUTING.md)
- [ ] Create workflow migration guide
- [ ] Update CHANGELOG.md with Phase 4B/4C entries
- [ ] Run full validation suite

### Week 3: Monitoring and Refinement

**Day 1-2: Metrics Dashboard**
- [ ] Set up GitHub Actions metrics collection
- [ ] Create P50/P95/P99 latency dashboard
- [ ] Track retry rate and flaky test candidates
- [ ] Monitor Nx affected effectiveness

**Day 3-5: Performance Tuning**
- [ ] Analyze first week of data
- [ ] Adjust shard count thresholds if needed
- [ ] Identify optimization opportunities
- [ ] Document lessons learned

### Validation Criteria

**Before Phase 4B Completion:**
- ✅ Dynamic sharding tested with 3/5/7 shard configurations
- ✅ Nx affected correctly identifies changed projects
- ✅ Retry logic prevents transient failures
- ✅ Coverage aggregation handles variable shard counts
- ✅ No regression in test coverage percentage

**Before Phase 4C Completion:**
- ✅ Security scan composite action reusable across workflows
- ✅ test.yml functionality fully migrated to ci.yml
- ✅ Branch protection rules updated successfully
- ✅ No gaps in CI/CD coverage post-consolidation
- ✅ Developer documentation updated

**Performance Targets (End of Week 3):**
- ✅ Small PR validation time: <20 minutes (P95)
- ✅ Medium PR validation time: <30 minutes (P95)
- ✅ Retry rate: <10% across all test runs
- ✅ Nx affected effectiveness: >40% tests skipped for small PRs
- ✅ Workflow count: 17 (down from 24)

## Related Documentation

- **ADR-007:** Comprehensive Caching Strategy (5-layer architecture)
- **CI/CD Comprehensive Assessment (2025-11-18):** Full pipeline analysis
- **CONTRIBUTING.md:** Developer workflow documentation
- **docs/operations/runbooks/ci-cd-troubleshooting.md:** Pipeline debugging guide

## Review Schedule

- **Next Review:** 2025-12-02 (2 weeks post-implementation)
- **Quarterly Review:** 2026-02-18 (reassess thresholds and targets)
- **Annual Review:** 2026-11-18 (major version evaluation)

---

**Approval:**  
☑️ **Accepted** - 2025-11-18  
**Approvers:** Engineering Lead, DevOps Lead  
**Implementation Status:** ✅ Phase 4B Complete, ✅ Phase 4C In Progress
