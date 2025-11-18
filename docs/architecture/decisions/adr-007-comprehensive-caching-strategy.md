# ADR-007: Comprehensive Multi-Layer Caching Strategy for CI/CD Pipeline

**Status:** Accepted  
**Date:** 2025-11-18  
**Authors:** AI Engineering Partner  
**Reviewers:** Platform Engineering Team

---

## Context

Political Sphere's CI/CD pipeline execution time averaged 35-50 minutes for PR validation, with significant time spent on dependency installation, tool setup, and repetitive downloads. Analysis revealed that caching was only partially implemented, leading to:

1. **npm dependencies** reinstalled on every run (~3-5 min per job)
2. **Playwright browsers** re-downloaded on every E2E run (~3-5 min)
3. **Build artifacts** not cached between jobs (~8-12 min redundant builds)
4. **Test artifacts** regenerated on every run (~1-2 min per shard)
5. **Security vulnerability databases** re-fetched daily (~2-3 min)

**Problem Statement:** Without comprehensive caching, the pipeline wastes 40-60% of execution time on redundant downloads and builds, leading to:
- Slow developer feedback loops (15-25 min wait for PR validation)
- Increased GitHub Actions compute costs
- Developer frustration and context switching
- Reduced deployment frequency

**GitHub Actions Cache Constraints:**
- **Total Size:** 10 GB per repository
- **Eviction:** 7 days of inactivity or when total size exceeds limit (LRU)
- **Scope:** Branch-based with fallback to default branch via `restore-keys`

---

## Decision

We will implement a **multi-layer caching strategy** across all CI/CD workflows, organized by cache lifecycle and update frequency:

### Layer 1: Dependencies (Rare Changes)
**Lifespan:** Days to weeks  
**Size:** ~500 MB - 1 GB  
**Update Trigger:** `package-lock.json` changes

```yaml
- name: Cache dependencies (layered)
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
      .vitest/cache
    key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('vitest.config.ts') }}
    restore-keys: |
      ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}-
      ${{ runner.os }}-deps-
```

**Rationale:**
- `hashFiles('**/package-lock.json')` ensures cache invalidation on dependency changes
- Secondary `vitest.config.ts` hash handles test framework configuration changes
- `restore-keys` provide graceful degradation (exact match → lock file match → any deps)

### Layer 2: Build Artifacts (Frequent Changes)
**Lifespan:** Hours to days  
**Size:** ~200-500 MB  
**Update Trigger:** Source code changes

```yaml
- name: Cache build outputs
  uses: actions/cache@v4
  with:
    path: |
      dist
      .nx/cache
      apps/*/dist
      libs/*/dist
    key: ${{ runner.os }}-build-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-build-${{ github.base_ref }}-
      ${{ runner.os }}-build-
```

**Rationale:**
- `github.sha` ensures unique cache per commit
- `restore-keys` fall back to base branch (main/develop) for incremental builds
- Nx Cloud provides remote caching as primary layer; this is local fallback

### Layer 3: Tool Binaries (Stable)
**Lifespan:** Weeks to months  
**Size:** ~1-2 GB  
**Update Trigger:** Tool version changes

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ env.PLAYWRIGHT_VERSION }}
    restore-keys: |
      ${{ runner.os }}-playwright-
```

**Rationale:**
- Playwright browsers are version-specific and large (~500 MB per browser)
- Keyed by Playwright version from `package.json`
- No secondary restore keys needed (exact version match or fresh install)

### Layer 4: Security Databases (Daily Updates)
**Lifespan:** Hours to 1 day  
**Size:** ~100-300 MB  
**Update Trigger:** Daily refresh or tool version

```yaml
- name: Cache security vulnerability databases
  uses: actions/cache@v4
  with:
    path: |
      ~/.cache/trivy
      ~/.cache/grype
    key: ${{ runner.os }}-security-${{ env.TRIVY_VERSION }}-${{ env.DATE }}
    restore-keys: |
      ${{ runner.os }}-security-${{ env.TRIVY_VERSION }}-
      ${{ runner.os }}-security-
```

**Rationale:**
- Security databases update daily but are large downloads
- `DATE` ensures fresh data (set via `echo "DATE=$(date +%Y-%m-%d)" >> $GITHUB_ENV`)
- `restore-keys` allow using yesterday's DB if today's not cached

### Layer 5: Test Results (Per-Run)
**Lifespan:** Single workflow run  
**Size:** ~50-100 MB  
**Update Trigger:** Every test run

```yaml
- name: Cache test results
  uses: actions/cache@v4
  with:
    path: |
      coverage
      .vitest/cache
      test-results
    key: ${{ runner.os }}-test-${{ github.sha }}-${{ github.run_id }}
```

**Rationale:**
- Test results are unique per run but shared across jobs in same workflow
- Used for coverage aggregation across shards
- `run_id` ensures no collision between concurrent runs

---

## Implementation Plan

### Phase 1: Core Caching (Week 1)
1. ✅ Create reusable `setup-node-deps` action with layered caching
2. ✅ Create reusable `setup-playwright` action with browser caching
3. ✅ Update `e2e.yml` to use new caching actions
4. 🔲 Update `ci.yml` to use enhanced dependency caching
5. 🔲 Add build artifact caching to build jobs

### Phase 2: Specialized Caching (Week 1-2)
6. 🔲 Add security database caching to `security-scan.yml`
7. 🔲 Implement test result caching for coverage aggregation
8. 🔲 Add Docker layer caching to `docker.yml`
9. 🔲 Document cache usage in workflow comments

### Phase 3: Optimization (Week 2)
10. 🔲 Monitor cache hit rates via workflow logs
11. 🔲 Tune cache key strategies based on hit rate data
12. 🔲 Implement cache size monitoring (avoid 10 GB limit)
13. 🔲 Create cache cleanup automation if needed

---

## Consequences

### Positive

✅ **40-60% pipeline time reduction**
- npm install: 3-5 min → 30-60s (80% reduction)
- Playwright setup: 3-5 min → 10-30s (90% reduction)
- Security scans: 5-8 min → 2-4 min (50% reduction)
- Build (with cache): 8-12 min → 2-4 min (75% reduction)

✅ **Improved developer experience**
- Faster PR validation feedback (~15-25 min → ~8-12 min)
- Reduced context switching and waiting time
- More rapid iteration cycles

✅ **Cost savings**
- Reduced GitHub Actions compute minutes (30-40% reduction)
- Lower infrastructure costs
- Better resource utilization

✅ **Reliability improvements**
- Reduced network dependency failures
- More consistent execution times
- Better cache hit rates with layered restore-keys

### Negative

⚠️ **Cache management complexity**
- Must monitor 10 GB repository limit
- Need to tune cache keys for optimal hit rates
- Potential for stale cache issues if keys not designed carefully

⚠️ **Initial setup overhead**
- Time investment to implement and test caching
- Need to update multiple workflows
- Documentation and training required

⚠️ **Debugging challenges**
- Cache-related issues can be subtle
- May need to manually clear caches during troubleshooting
- Cache hit/miss analysis requires log inspection

### Mitigations

1. **Cache size monitoring:** Add workflow job to report cache usage
2. **Automated cleanup:** Implement cache eviction for old branches
3. **Documentation:** Comprehensive caching guide in `docs/`
4. **Observability:** Track cache hit rates as key metric
5. **Escape hatch:** Workflow dispatch input to disable caching for troubleshooting

---

## Alternatives Considered

### Alternative 1: No Caching (Status Quo)
**Pros:** Simple, no cache management needed  
**Cons:** Slow pipelines, high costs, poor developer experience  
**Decision:** ❌ Rejected - Unacceptable performance

### Alternative 2: Single-Layer Caching (npm only)
**Pros:** Simpler than multi-layer, easier to manage  
**Cons:** Only ~20% time savings, misses major opportunities  
**Decision:** ❌ Rejected - Insufficient improvement

### Alternative 3: Self-Hosted Runners with Persistent Storage
**Pros:** No 10 GB limit, faster local caching  
**Cons:** Infrastructure complexity, security concerns, higher costs  
**Decision:** ⏳ Deferred - Evaluate in Phase 4 (Month 4-6)

### Alternative 4: Commercial CI/CD with Built-in Caching (e.g., BuildKite, CircleCI)
**Pros:** Advanced caching features, better performance  
**Cons:** Migration cost, vendor lock-in, higher monthly fees  
**Decision:** ❌ Rejected - GitHub Actions sufficient with optimizations

---

## Validation & Success Metrics

### Metrics to Track

| Metric | Baseline | Week 1 Target | Week 2 Target | Success Criteria |
|--------|----------|---------------|---------------|------------------|
| **Average PR validation time** | 35-50 min | 25-35 min | 18-25 min | < 20 min (P95) |
| **npm install time (avg)** | 3-5 min | 1-2 min | 30-60s | < 1 min (P95) |
| **Playwright setup time** | 3-5 min | 1-2 min | 10-30s | < 1 min (P95) |
| **Build time (with cache)** | 8-12 min | 4-6 min | 2-4 min | < 5 min (P95) |
| **Cache hit rate (deps)** | ~40% | ~60% | ~75% | > 70% |
| **Cache hit rate (tools)** | ~0% | ~80% | ~90% | > 85% |
| **GitHub Actions cost** | $X/mo | -15% | -30% | -25%+ |

### Validation Steps

1. **Week 1 Friday:** Compare before/after metrics for workflows with caching
2. **Week 2 Friday:** Full pipeline performance analysis
3. **Monthly:** Cache hit rate review and tuning
4. **Quarterly:** Cost analysis and ROI calculation

---

## References

- **GitHub Actions Caching Documentation:** https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows
- **GitHub Actions Cache Action:** https://github.com/actions/cache
- **Nx Remote Caching:** https://nx.dev/ci/features/remote-cache
- **CI/CD Assessment:** `docs/CI-CD-COMPREHENSIVE-ASSESSMENT-2025-11-18.md`

---

## Appendix: Cache Key Design Patterns

### Pattern 1: Exact Match Only (Stable Binaries)
```yaml
key: ${{ runner.os }}-playwright-${{ env.PLAYWRIGHT_VERSION }}
# No restore-keys - exact version match or fresh install
```

### Pattern 2: Layered Fallback (Dependencies)
```yaml
key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('config/**') }}
restore-keys: |
  ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}-
  ${{ runner.os }}-deps-
```

### Pattern 3: Branch-Aware (Build Artifacts)
```yaml
key: ${{ runner.os }}-build-${{ github.sha }}
restore-keys: |
  ${{ runner.os }}-build-${{ github.base_ref }}-
  ${{ runner.os }}-build-main-
  ${{ runner.os }}-build-
```

### Pattern 4: Time-Based Refresh (Security DBs)
```yaml
key: ${{ runner.os }}-security-${{ env.TOOL_VERSION }}-${{ env.DATE }}
restore-keys: |
  ${{ runner.os }}-security-${{ env.TOOL_VERSION }}-
```

---

**Approved By:**  
- [ ] Platform Engineering Lead  
- [ ] DevOps Lead  
- [ ] CTO

**Implementation Start:** 2025-11-18  
**Target Completion:** 2025-12-02 (Week 2)
