# AI Maintenance Standard Operating Procedure (SOP)

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Next Review:** 2025-02-XX  
**Owner:** Technical Governance Committee  
**Applies To:** All AI development tools and systems

---

## Executive Summary

This SOP defines maintenance procedures for Political Sphere's AI development system, covering nightly automation, troubleshooting, metrics monitoring, and escalation workflows. Following this SOP ensures AI tools remain operational, accurate, and integrated into daily development practice.

**Critical Success Factors:**
- AI indices updated nightly with <2% failure rate
- Competence scores maintained above 0.6 threshold
- Context bundles refreshed weekly minimum
- 95%+ uptime for AI tool availability
- <5min p95 latency for AI-assisted operations

---

## Table of Contents

1. [Routine Maintenance Tasks](#routine-maintenance-tasks)
2. [Nightly Automation (ai-maintenance.yml)](#nightly-automation-ai-maintenanceyml)
3. [Developer Workflow Integration](#developer-workflow-integration)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Metrics and Monitoring](#metrics-and-monitoring)
6. [Escalation Procedures](#escalation-procedures)
7. [Recovery Procedures](#recovery-procedures)
8. [Tool-Specific Maintenance](#tool-specific-maintenance)

---

## Routine Maintenance Tasks

### Daily (Automated - ai-maintenance.yml)

**Schedule:** 2 AM UTC (low-carbon period)  
**Duration:** 20-30 minutes typical  
**Owner:** GitHub Actions automation

**Tasks:**
- ✅ Incremental code index update (index-if-changed.js)
- ✅ Context bundle refresh (build-context-bundles.js)
- ✅ Cache pre-warming (pre-cache.js)
- ✅ Competence assessment (competence-monitor.js)
- ✅ Performance metrics collection (performance-monitor.js)
- ✅ Smoke test execution (smoke.sh)
- ✅ Artifact publication to ai-index-cache branch

**Success Criteria:**
- All jobs complete without failure
- Index metadata shows updated timestamp
- Competence score ≥ 0.5
- Smoke tests pass 100%

**Failure Actions:**
- Auto-create GitHub issue with label `ai-system`, `maintenance`
- Alert on-call team if 3+ consecutive failures
- Rollback to previous index if corruption detected

### Weekly (Manual Review)

**Schedule:** Every Monday 10 AM  
**Duration:** 30-60 minutes  
**Owner:** Lead Developer / AI System Steward

**Tasks:**
1. **Review Competence Trends**
   - Check weekly competence score trend (ai-metrics/stats.json)
   - Investigate declining scores (target: maintain > 0.6)
   - Review AI-generated code quality patterns

2. **Context Bundle Validation**
   - Verify context bundles cover current work areas
   - Add new context bundles for new feature areas
   - Remove obsolete context bundles

3. **Performance Audit**
   - Check AI tool latency metrics (p50, p95, p99)
   - Identify slow queries or operations
   - Optimize indexing for frequently accessed paths

4. **Index Health Check**
   - Validate index integrity (no corruption)
   - Check index size growth (warn if >500MB)
   - Verify search result relevance

5. **Artifact Cleanup**
   - Review artifact retention (30 days default)
   - Archive important historical metrics
   - Remove stale cache entries

**Documentation:**
- Document findings in weekly report: `ai-metrics/weekly-report-YYYY-MM-DD.md`
- Update AI_TOOLS_STATUS.md if tool status changes
- Create ADRs for significant AI system changes

### Monthly (Governance Review)

**Schedule:** First Monday of month, TGC meeting  
**Duration:** 60-90 minutes  
**Owner:** Technical Governance Committee

**Tasks:**
1. **Strategic Assessment**
   - Review AI assistance effectiveness KPIs
   - Measure value delivered (time saved, errors prevented)
   - Assess neutrality compliance and bias metrics

2. **Tool Lifecycle Management**
   - Audit all 37 AI tools for utility and usage
   - Deprecate unused or redundant tools
   - Identify gaps in AI tooling coverage

3. **Governance Compliance**
   - Verify NIST AI RMF 1.0 compliance
   - Review human-in-the-loop oversight logs
   - Validate political neutrality safeguards

4. **Capacity Planning**
   - Forecast index growth and storage needs
   - Plan for scaling AI infrastructure
   - Budget for AI API costs (if applicable)

**Outputs:**
- Monthly AI system health report
- Updated AI roadmap and priorities
- Governance attestation for compliance

---

## Nightly Automation (ai-maintenance.yml)

### Workflow Overview

**Location:** `.github/workflows/ai-maintenance.yml`  
**Triggers:**
- Schedule: 2 AM UTC daily
- Manual: workflow_dispatch
- Push: main branch changes to AI tools

**Jobs:**
1. `build-ai-indices` - Update code indices and context bundles
2. `competence-assessment` - Evaluate AI-generated code quality
3. `performance-monitoring` - Collect metrics and analytics
4. `smoke-test` - Validate all AI tools functional
5. `publish-indices` - Commit updated artifacts to ai-index-cache branch
6. `notify-on-failure` - Create issue if any job fails

### Monitoring Nightly Runs

**Check Workflow Status:**
```bash
# View recent AI maintenance runs
gh run list --workflow=ai-maintenance.yml --limit=10

# View specific run details
gh run view <run-id>

# Download artifacts from latest run
gh run download --name ai-indices-<run-number>
```

**Success Indicators:**
- ✅ All jobs show green checkmarks
- ✅ Artifacts uploaded successfully
- ✅ ai-index-cache branch updated with commit
- ✅ Index metadata shows current timestamp

**Failure Patterns:**
- 🔴 `build-ai-indices` fails → Index corruption or file access issue
- 🔴 `competence-assessment` fails → Metrics file corruption or invalid data
- 🔴 `smoke-test` fails → AI tool regression or dependency issue
- 🔴 `publish-indices` fails → Git push conflict or permissions issue

### Manual Workflow Execution

**Force Full Rebuild:**
```bash
gh workflow run ai-maintenance.yml --field full_rebuild=true
```

**Trigger After Code Changes:**
```bash
# Workflow auto-triggers on push to main affecting AI tools
git push origin main
```

---

## Developer Workflow Integration

### Pre-Commit Hooks (.lefthook.yml)

AI validations run automatically before each commit:

**Enabled Hooks:**
1. **ai-neutrality-check** - Political neutrality validation
2. **ai-semantic-quality** - Semantic code quality analysis
3. **ai-competence-quick** - Quick competence assessment on changed files

**Workflow:**
```bash
# Stage changes
git add src/feature.ts

# Commit triggers hooks automatically
git commit -m "feat: add new feature"

# Hooks run:
# 1. Prettier/ESLint auto-fix
# 2. TypeScript type-check
# 3. AI neutrality check ← NEW
# 4. AI semantic quality ← NEW
# 5. AI competence quick-check ← NEW
```

**Hook Behavior:**
- Non-blocking warnings (don't fail commit)
- Logs written to `.git/hooks/lefthook.log`
- Can be skipped in emergencies: `LEFTHOOK=0 git commit`

### Pre-Push Validation

**AI Index Update:**
Before pushing to remote, AI index updates with recent changes:

```bash
git push origin feature-branch

# Pre-push hook:
# 1. Runs update-recent-changes.js
# 2. Updates AI index incrementally
# 3. Allows push to proceed (non-blocking)
```

**Manual Index Update:**
```bash
node tools/scripts/ai/update-recent-changes.js
```

### CI/CD Integration (ai-governance.yml)

AI validations run on every PR:

**Jobs:**
1. **political-neutrality** - Neutrality check on changed files
2. **nist-ai-rmf-compliance** - NIST AI RMF governance validation
3. **validation-gate-tests** - 3-tier validation gate tests
4. **semantic-quality-check** - Semantic code analysis
5. **competence-assessment** - AI code quality assessment
6. **context-quality-check** - Context bundle validation
7. **change-budget-validation** - Enforce change budget limits

**PR Comment Feedback:**
- Semantic quality report added as comment
- Competence score displayed in artifacts
- Failures block PR merge (except warnings)

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Code Indexer Fails with "Invalid file entry"

**Symptoms:**
```
Error: Invalid file entry for <file>: missing required fields
```

**Root Cause:**
File metadata missing required fields (path, size, content, etc.)

**Solution:**
```bash
# Rebuild index from scratch
node tools/scripts/ai/code-indexer.js build --full

# If persists, check file permissions
ls -la <failing-file>

# Validate file is readable
cat <failing-file> > /dev/null
```

**Prevention:**
- Run incremental updates, not full rebuilds daily
- Validate file access before indexing
- Add .gitignore patterns for problematic files

---

#### Issue: Index Server Fails to Start

**Symptoms:**
```
Error: listen EADDRINUSE :::3001
```

**Root Cause:**
Port 3001 already in use by another process

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill process (if safe)
kill -9 <PID>

# Or use different port
PORT=3030 node tools/scripts/ai/index-server.js
```

**Prevention:**
- Use dynamic port allocation in tests
- Add port availability check before starting server
- Kill orphaned processes in cleanup scripts

---

#### Issue: Competence Score Dropping

**Symptoms:**
- Competence score < 0.5 for multiple weeks
- Increased code quality issues in AI-generated code

**Root Cause:**
- Declining code quality in recent commits
- Increased complexity without test coverage
- Outdated AI context bundles

**Investigation:**
```bash
# Review recent competence assessments
ls -lrt ai-metrics/stats.json

# Check metrics history
cat ai-metrics/stats.json | jq '.history[] | select(.date > "2025-01-01")'

# Identify low-quality commits
git log --since="2 weeks ago" --grep="ai:" --oneline
```

**Solution:**
1. Review recent AI-generated code commits
2. Improve test coverage for recent features
3. Refresh AI context bundles: `npm run ai:refresh`
4. Conduct code quality audit of flagged areas
5. Retrain developers on AI assistance best practices

**Prevention:**
- Maintain >80% test coverage
- Regular context bundle updates
- Human review of all AI-generated code
- Monthly competence trend reviews

---

#### Issue: Context Bundles Outdated

**Symptoms:**
- Context quality check warnings
- Irrelevant AI suggestions
- Missing context for new feature areas

**Solution:**
```bash
# Rebuild all context bundles
node tools/scripts/ai/build-context-bundles.js

# Verify bundles created
ls -la tools/ai/context-bundles/

# Reload context cache
node tools/scripts/ai/context-preloader.js preload
```

**Prevention:**
- Run weekly context bundle refresh
- Add new bundles when starting new feature areas
- Monitor context freshness in CI checks

---

#### Issue: AI Neutrality Check False Positives

**Symptoms:**
- Legitimate political terminology flagged incorrectly
- Commit blocked despite neutral content

**Investigation:**
```bash
# Run neutrality check manually
node tools/scripts/ai/ci-neutrality-check.mts <file>

# Review flagged patterns
cat tools/scripts/ai/neutrality-patterns.json
```

**Solution:**
1. Review flagged content for actual bias
2. If false positive, update neutrality patterns
3. Add context-aware exceptions
4. Document rationale in ADR

**Prevention:**
- Regularly review and refine neutrality patterns
- Use context-aware analysis (not just keyword matching)
- Human review for borderline cases
- Quarterly neutrality pattern audit

---

## Metrics and Monitoring

### Key Performance Indicators (KPIs)

**AI System Health:**
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Competence Score | >0.7 | 0.5-0.7 | <0.5 |
| Index Update Success Rate | >98% | 95-98% | <95% |
| AI Tool Availability | >99% | 97-99% | <97% |
| Smoke Test Pass Rate | 100% | 95-99% | <95% |
| p95 Latency (search) | <200ms | 200-500ms | >500ms |
| Cache Hit Rate | >80% | 60-80% | <60% |

**AI Effectiveness:**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Time Saved per Week | >10 hours | Developer surveys + time tracking |
| Errors Prevented | >50/week | Validation failures caught |
| Code Quality Improvement | +15% | Sonar quality gate scores |
| Development Velocity | +20% | Story points per sprint |

### Monitoring Dashboards

**Grafana Dashboard: AI System Health**

**Panels:**
1. Competence Score Trend (line chart, 30 days)
2. Index Update Status (gauge: success/failure)
3. AI Tool Latency (histogram, p50/p95/p99)
4. Cache Performance (hit rate %, cache size MB)
5. Workflow Success Rate (bar chart by job)
6. Artifact Size Growth (line chart, 90 days)

**Alerts:**
- Competence score <0.5 for 3 consecutive days
- AI maintenance workflow fails 3+ times in 7 days
- p95 latency >500ms for 1 hour
- Cache hit rate <60% for 24 hours

**Access:**
```bash
# Local Grafana (if running)
open http://localhost:3000/dashboards/ai-system-health

# Production Grafana
open https://monitoring.political-sphere.com/dashboards/ai-system
```

### Metrics Files

**Locations:**
- `ai-metrics/stats.json` - Competence and quality metrics
- `ai-metrics/performance.json` - Latency and throughput metrics
- `ai-metrics/usage.json` - Tool usage statistics
- `ai-index/metadata.json` - Index metadata (size, files, timestamp)

**Schema (ai-metrics/stats.json):**
```json
{
  "competenceScore": 0.72,
  "lastAssessment": "2025-01-XX",
  "history": [
    {
      "date": "2025-01-XX",
      "score": 0.72,
      "recommendations": ["Collect more data"],
      "filesAnalyzed": 234
    }
  ],
  "trends": {
    "weeklyChange": "+0.05",
    "monthlyChange": "+0.12"
  }
}
```

### Log Files

**AI Tool Logs:**
- `.git/hooks/lefthook.log` - Pre-commit hook execution logs
- `logs/ai/` - Individual tool execution logs (if configured)
- GitHub Actions logs - Workflow execution logs (90 days retention)

**Log Retention:**
- Local logs: 30 days rolling
- GitHub Actions: 90 days
- Archived metrics: Indefinite (compressed)

---

## Escalation Procedures

### Severity Levels

**P0 - Critical (Immediate Response)**

**Criteria:**
- AI system completely unavailable for >1 hour
- Data corruption detected in indices
- Security vulnerability in AI tools discovered
- Political bias detected and merged to production

**Response:**
1. Page on-call engineer immediately
2. Create incident in incident management system
3. Notify Technical Governance Committee
4. Rollback to last known good state
5. Begin root cause analysis

**SLA:** 15 minutes to response, 4 hours to resolution

---

**P1 - High (Same Day Response)**

**Criteria:**
- AI maintenance workflow fails 3+ consecutive days
- Competence score <0.3
- AI tool availability <95% for 24 hours
- Critical AI validation bypass detected

**Response:**
1. Create high-priority GitHub issue
2. Assign to AI System Steward
3. Investigate within 4 hours
4. Resolution plan within 24 hours

**SLA:** 4 hours to investigation, 24 hours to resolution plan

---

**P2 - Medium (Week Response)**

**Criteria:**
- Competence score declining trend (0.5-0.7)
- AI tool latency degradation
- Context bundles outdated >14 days
- Minor neutrality check false positives

**Response:**
1. Create GitHub issue with label `ai-system`, `maintenance`
2. Schedule for weekly review
3. Document in TODO.md
4. Address in next sprint

**SLA:** 7 days to resolution

---

**P3 - Low (Best Effort)**

**Criteria:**
- Feature requests for AI tools
- Performance optimization opportunities
- Documentation updates

**Response:**
1. Add to AI system backlog
2. Prioritize in quarterly planning
3. No specific SLA

---

### Escalation Contacts

| Role | Primary Contact | Backup Contact |
|------|----------------|----------------|
| AI System Steward | Lead Developer | TGC Chair |
| On-Call Engineer | Rotation schedule | Backup rotation |
| Incident Commander | TGC Chair | Lead Developer |
| Security Team | Security Lead | CISO |

**Contact Methods:**
- Critical (P0): Phone call + Slack ping + PagerDuty
- High (P1): Slack mention + GitHub issue assignment
- Medium/Low (P2/P3): GitHub issue only

---

## Recovery Procedures

### Index Corruption Recovery

**Symptoms:**
- Search returns no results
- Index validation fails
- Files missing from index

**Recovery Steps:**
1. **Stop all AI tools using index:**
   ```bash
   # Kill index server if running
   pkill -f index-server.js
   ```

2. **Backup corrupted index:**
   ```bash
   mv ai-index/ ai-index-corrupted-$(date +%Y%m%d)
   mv ai-cache/ ai-cache-corrupted-$(date +%Y%m%d)
   ```

3. **Restore from last good artifacts:**
   ```bash
   # Download latest ai-maintenance.yml artifacts
   gh run download --name ai-indices-<recent-run>
   
   # Or pull from ai-index-cache branch
   git fetch origin ai-index-cache
   git checkout origin/ai-index-cache -- ai-index/ ai-cache/
   ```

4. **Rebuild if no good backup:**
   ```bash
   # Full rebuild (takes 10-20 minutes)
   node tools/scripts/ai/code-indexer.js build --full
   node tools/scripts/ai/build-context-bundles.js
   node tools/scripts/ai/context-preloader.js preload
   ```

5. **Validate recovery:**
   ```bash
   # Run smoke test
   bash tools/scripts/ai/smoke.sh
   
   # Check index health
   node tools/scripts/ai/code-indexer.js validate
   ```

6. **Resume services:**
   ```bash
   # Restart index server
   node tools/scripts/ai/index-server.js &
   ```

**Post-Recovery:**
- Document root cause in incident report
- Update index validation logic
- Add additional health checks
- Test recovery procedure quarterly

---

### AI Maintenance Workflow Failure Recovery

**Symptoms:**
- Nightly run fails repeatedly
- Artifacts not published
- No index updates for >3 days

**Recovery Steps:**
1. **Check workflow logs:**
   ```bash
   gh run view <failed-run-id> --log
   ```

2. **Identify failing job:**
   - build-ai-indices → Index build issue
   - competence-assessment → Metrics file issue
   - smoke-test → AI tool regression
   - publish-indices → Git push issue

3. **Run failed job manually:**
   ```bash
   # Example: Re-run index build locally
   node tools/scripts/ai/code-indexer.js build
   ```

4. **Fix underlying issue:**
   - Update tool code if regression
   - Fix file permissions if access denied
   - Resolve Git conflicts if push failed

5. **Trigger workflow manually:**
   ```bash
   gh workflow run ai-maintenance.yml
   ```

6. **Monitor next nightly run:**
   - Check logs next morning
   - Verify artifacts published
   - Confirm index updated

**Prevent Recurrence:**
- Add more robust error handling
- Improve retry logic
- Enhance validation checks
- Update runbook with new failure mode

---

## Tool-Specific Maintenance

### code-indexer.js

**Purpose:** Build and search semantic code index

**Maintenance:**
- Monitor index size (warn if >500MB)
- Validate index integrity weekly
- Rebuild from scratch monthly (during low-traffic period)

**Common Issues:**
- File validation errors → Check file permissions
- Out of memory → Increase Node.js heap size: `NODE_OPTIONS=--max-old-space-size=4096`
- Slow indexing → Reduce concurrency: `INDEXER_CONCURRENCY=2`

**Health Check:**
```bash
node tools/scripts/ai/code-indexer.js validate
```

---

### competence-monitor.js

**Purpose:** Assess AI-assisted code quality

**Maintenance:**
- Review metrics weekly
- Calibrate thresholds quarterly
- Add new quality indicators as needed

**Common Issues:**
- No metrics file → Run initial assessment: `node tools/scripts/ai/competence-monitor.js assess`
- Low scores → Review recent commits, improve test coverage
- Metric drift → Recalibrate baselines

**Health Check:**
```bash
node tools/scripts/ai/competence-monitor.js assess
cat ai-metrics/stats.json | jq '.competenceScore'
```

---

### semantic-indexer.cjs

**Purpose:** Advanced semantic code analysis

**Maintenance:**
- Update embedding models quarterly
- Tune similarity thresholds based on feedback
- Add new code patterns to pattern library

**Dependencies:**
- embedding-engine.cjs (AI model API)
- vector-store.cjs (vector database)

**Health Check:**
```bash
node tools/scripts/ai/semantic-indexer.cjs test
```

---

### context-preloader.js

**Purpose:** Preload AI context bundles

**Maintenance:**
- Refresh context bundles weekly
- Add new bundles for new feature areas
- Remove obsolete bundles

**Common Issues:**
- Missing bundles → Run build-context-bundles.js
- Stale context → Check lastUpdated timestamp

**Health Check:**
```bash
node tools/scripts/ai/context-preloader.js validate
```

---

## Appendix

### Quick Reference Commands

**Daily Operations:**
```bash
# Check AI system health
npm run ai:status

# Update AI context
npm run ai:refresh

# Run smoke tests
bash tools/scripts/ai/smoke.sh

# View competence score
cat ai-metrics/stats.json | jq '.competenceScore'
```

**Troubleshooting:**
```bash
# Rebuild index from scratch
node tools/scripts/ai/code-indexer.js build --full

# Validate index integrity
node tools/scripts/ai/code-indexer.js validate

# Test all AI tools
node tools/scripts/ai/test-all-tools.cjs

# View workflow logs
gh run list --workflow=ai-maintenance.yml
gh run view <run-id> --log
```

**Maintenance:**
```bash
# Manual workflow trigger
gh workflow run ai-maintenance.yml

# Download latest artifacts
gh run download --name ai-indices-<run-number>

# View metrics trends
cat ai-metrics/stats.json | jq '.history'
```

### Related Documentation

- **AI Tools Status:** `tools/scripts/ai/AI_TOOLS_STATUS.md`
- **AI Governance:** `docs/07-ai-and-simulation/ai-governance.md`
- **AI System Implementation:** `AI-SYSTEM-IMPLEMENTATION-SUMMARY.md`
- **Copilot Instructions:** `.github/copilot-instructions.md`
- **TODO Tracking:** `docs/TODO.md`

### Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-XX | AI Agent | Initial SOP creation |

---

**Next Review:** 2025-02-XX  
**Review Owner:** Technical Governance Committee
