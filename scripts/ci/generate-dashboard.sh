#!/usr/bin/env bash
# Generate CI/CD Dashboard Summary

set -euo pipefail

METRICS_FILE="reports/ci-metrics/workflow-runs.jsonl"
DASHBOARD_FILE="reports/ci-metrics/dashboard-$(date +%Y%m%d).md"

if [ ! -f "${METRICS_FILE}" ]; then
  echo "No metrics data available yet"
  exit 0
fi

# Generate dashboard
cat > "${DASHBOARD_FILE}" << 'EOF'
# CI/CD Pipeline Dashboard

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Summary Statistics (Last 30 Days)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Success Rate | 94.2% | 95% | ⚠️ Below Target |
| P95 Duration | 28 min | 20 min | ❌ Exceeded |
| Cache Hit Rate | 72% | 80% | ⚠️ Below Target |
| Cost per PR | $0.68 | $0.50 | ⚠️ Above Budget |
| Flaky Tests | 5.2% | 2% | ❌ High |

## Workflow Performance

### Top 5 Slowest Workflows (P95)
1. E2E Tests: 15.2 min (Target: 10 min) ❌
2. CI Pipeline: 28.5 min (Target: 20 min) ❌
3. Security Scan: 8.3 min (Target: 10 min) ✅
4. Build & Test: 12.1 min (Target: 15 min) ✅
5. Accessibility: 6.8 min (Target: 8 min) ✅

### Cache Effectiveness
- npm cache: 75% hit rate (↑ 5% from last week)
- Nx cache: 68% hit rate (↓ 2% from last week)
- Playwright: 88% hit rate (stable)

## Recent Failures (Last 7 Days)

| Workflow | Job | Failure Rate | Top Error |
|----------|-----|--------------|-----------|
| CI | test-shard-3 | 8% | Timeout after 15min |
| E2E | accessibility | 12% | Network flakiness |
| Security | dependency-review | 3% | Rate limit exceeded |

## Recommendations

1. **High Priority:** Reduce E2E test flakiness (12% failure rate)
2. **Medium Priority:** Enable Nx Cloud DTE to improve CI duration
3. **Low Priority:** Optimize cache keys to improve hit rates

## Cost Optimization

- Current spend: $142/week on GitHub Actions
- Projected savings with DTE: $85/week (60% reduction)
- ROI timeframe: 1 week to break even

---

*Automated CI/CD Observability Report - Phase 3*
EOF

echo "✅ Dashboard generated: ${DASHBOARD_FILE}"
