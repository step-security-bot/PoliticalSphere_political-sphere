# AI System Usage Guide

**Version:** 1.0.0  
**Last Updated:** 2025-11-14  
**Audience:** Developers working on Political Sphere  
**Prerequisite:** Read `.github/copilot-instructions.md` first

---

## Quick Start

### Daily Developer Workflow

**Morning Setup (5 minutes):**
```bash
# 1. Check AI system health
npm run ai:status

# 2. Update local AI context
npm run ai:refresh

# 3. Verify pre-commit hooks enabled
lefthook version  # Should show 1.5.0+
```

**During Development:**
```bash
# Before starting work - search for relevant code
npm run ai:search "authentication logic"

# While coding - AI tools run automatically on git commit
git add src/feature.ts
git commit -m "feat: add feature"
# → Triggers: neutrality check, semantic quality, competence assessment

# Before pushing - index updates automatically
git push origin feature-branch
# → Triggers: update-ai-index (incremental)
```

**End of Day (2 minutes):**
```bash
# Check if you triggered any AI warnings
cat .git/hooks/lefthook.log | grep "⚠️"

# Optional: Update metrics with your session
node tools/scripts/ai/analytics.js log-session
```

---

## AI Tools Reference

### Core Tools (Use Daily)

#### ai:search - Semantic Code Search
**Purpose:** Find relevant code across the entire codebase using natural language

**Usage:**
```bash
# Search for concepts
npm run ai:search "user authentication flow"
npm run ai:search "voting validation logic"
npm run ai:search "error handling patterns"

# Search for specific functionality
npm run ai:search "where is JWT validation"
npm run ai:search "how to add new API endpoint"
```

**When to Use:**
- Starting work on unfamiliar area
- Looking for implementation examples
- Finding where to add new code
- Understanding existing patterns

**Output:** JSON with file paths, relevance scores, code snippets

---

#### ai:context - Build Context for AI Assistants
**Purpose:** Generate comprehensive context for AI pair programming

**Usage:**
```bash
# Full context refresh
npm run ai:context

# Specific area focus
npm run ai:context --area=authentication
npm run ai:context --area=voting
npm run ai:context --area=governance
```

**When to Use:**
- Before long AI-assisted coding session
- When AI suggestions seem outdated
- After major codebase changes
- Weekly refresh (automated in maintenance.yml)

**Output:** Context bundles in `tools/ai/context-bundles/`

---

#### ai:index - Build/Update Code Index
**Purpose:** Create searchable semantic index of codebase

**Usage:**
```bash
# Full rebuild (takes 10-20 minutes)
npm run ai:index build

# Search existing index
npm run ai:index search "function implementation"

# Validate index health
npm run ai:index validate
```

**When to Use:**
- After checking out new branch
- After pulling major changes
- When search results seem stale
- Troubleshooting AI tool issues

**Output:** `ai-index/` directory with searchable database

---

### Quality Tools (Automated in CI/CD)

#### Neutrality Checker
**Purpose:** Detect political bias in code, comments, docs

**Automated Execution:**
- Pre-commit hook: `ai-neutrality-check`
- CI workflow: `political-neutrality` job in ai-governance.yml

**Manual Usage:**
```bash
node tools/scripts/ai/ci-neutrality-check.mts src/feature.ts
```

**What It Checks:**
- Variable names with political connotations
- Comments with partisan language
- Documentation with biased examples
- Test data with real-world political references

**How to Fix Violations:**
- Use neutral placeholders: "Party A", "Candidate X"
- Remove partisan examples from docs
- Use synthetic test data only
- Replace political terminology with generic terms

**Example Violations:**
```javascript
// ❌ BAD
const labourPolicy = getPolicy('labour');
const toryVoters = filterVoters('conservative');

// ✅ GOOD
const leftPolicy = getPolicy('left');
const rightVoters = filterVoters('right');

// ✅ BETTER
const policyA = getPolicy('policy-a');
const votersGroupB = filterVoters('group-b');
```

---

#### Semantic Quality Checker
**Purpose:** Analyze code quality using semantic understanding

**Automated Execution:**
- Pre-commit hook: `ai-semantic-quality`
- CI workflow: `semantic-quality-check` job in ai-governance.yml

**Manual Usage:**
```bash
node tools/scripts/ai/semantic-indexer.cjs analyze src/feature.ts
```

**What It Checks:**
- Code complexity and maintainability
- Naming conventions and clarity
- Pattern consistency with codebase
- Semantic coherence

**Interpreting Results:**
- Quality Score 0.8-1.0: Excellent
- Quality Score 0.6-0.8: Good
- Quality Score 0.4-0.6: Needs improvement
- Quality Score <0.4: Refactor recommended

---

#### Competence Monitor
**Purpose:** Assess overall AI-assisted code quality trends

**Automated Execution:**
- Nightly: `competence-assessment` in ai-maintenance.yml
- PR: `competence-assessment` job in ai-governance.yml

**Manual Usage:**
```bash
# Full assessment
node tools/scripts/ai/competence-monitor.js assess

# Quick check on specific files
node tools/scripts/ai/competence-monitor.js quick-check src/feature.ts
```

**Competence Score Meaning:**
- 0.7-1.0: High quality AI assistance
- 0.5-0.7: Acceptable quality, monitor trends
- 0.3-0.5: Declining quality, review practices
- <0.3: Critical, immediate intervention needed

**When Score Drops:**
1. Review recent AI-generated commits
2. Check test coverage hasn't declined
3. Refresh AI context: `npm run ai:refresh`
4. Conduct code quality audit
5. Retrain on AI assistance best practices

---

### Advanced Tools (Occasional Use)

#### ai:optimize - Optimize AI Caches
**Purpose:** Clean up and optimize AI caching for performance

**Usage:**
```bash
npm run ai:optimize

# Check cache statistics
npm run ai:cache stats
```

**When to Use:**
- AI tools running slowly
- Cache size >500MB
- After major dependency updates

---

#### ai:ast - AST Analysis
**Purpose:** Deep abstract syntax tree analysis for code understanding

**Usage:**
```bash
npm run ai:ast src/feature.ts
```

**When to Use:**
- Need deep structural code analysis
- Building custom code transformations
- Advanced refactoring assistance

---

## Interpreting AI Feedback

### Pre-Commit Hook Warnings

**Example Output:**
```bash
⚠️ AI neutrality check completed with warnings
  - Potential partisan term detected in src/feature.ts:42
  - Consider using neutral terminology
```

**Action:**
1. Review flagged line in editor
2. Assess if truly biased or false positive
3. If biased: Refactor to neutral language
4. If false positive: Document justification in PR
5. Commit proceeds regardless (warnings don't block)

---

### CI Workflow Failures

**Scenario: Change Budget Violation**
```
❌ Change Budget Violation
This PR exceeds the change budget for Fast-Secure mode (200 lines, 8 files)
```

**Actions:**
- **Option 1 (Recommended):** Split PR into smaller focused changes
- **Option 2:** Switch to Safe mode (≤300 lines, ≤12 files)
- **Option 3:** Use Audit mode if comprehensive changes required
- **Option 4:** Remove non-essential changes from PR

---

**Scenario: Political Neutrality Failed**
```
❌ Political Neutrality Validation Failed
Flagged content in: src/components/PartySelector.tsx
```

**Actions:**
1. Click workflow link to see detailed report
2. Review flagged file sections
3. Replace partisan terms with neutral placeholders
4. Re-run CI after fixes
5. Document pattern in ADR if recurring issue

---

**Scenario: Competence Score Warning**
```
⚠️ Competence Score: 0.52 (below target 0.7)
Recommendations:
- Improve test coverage for recent changes
- Review AI-generated code quality
```

**Actions:**
1. Check which recent commits lowered score
2. Add missing tests for new features
3. Refactor complex AI-generated code
4. Update AI context bundles
5. Monitor score in next assessment

---

## Common Workflows

### Starting New Feature

```bash
# 1. Search for similar implementations
npm run ai:search "similar feature pattern"

# 2. Review context for feature area
cat tools/ai/context-bundles/frontend-components.md

# 3. Start development with AI assistance
# Use GitHub Copilot with updated context

# 4. Commit triggers automatic validation
git commit -m "feat(area): implement feature"
# → neutrality check, semantic quality, competence check run

# 5. Push updates index
git push
# → AI index updated with new code
```

---

### Troubleshooting AI Tool Issues

```bash
# 1. Run smoke test to identify broken tools
bash tools/scripts/ai/smoke.sh

# 2. Check AI system status
npm run ai:status

# 3. Review recent failures
cat .git/hooks/lefthook.log | tail -50

# 4. Rebuild index if search broken
npm run ai:index build --full

# 5. Clear and rebuild cache
rm -rf ai-cache/
npm run ai:optimize

# 6. Refresh all context
npm run ai:refresh

# 7. Check workflow runs
gh run list --workflow=ai-maintenance.yml --limit=5
```

---

### Reviewing AI-Generated Code

**Checklist for PR Reviews:**
- [ ] Tests included for new functionality
- [ ] No hardcoded secrets or credentials
- [ ] Accessibility attributes present (WCAG 2.2 AA)
- [ ] Error handling implemented
- [ ] Political neutrality maintained
- [ ] Type safety enforced (no `any` types)
- [ ] Security best practices followed
- [ ] Performance considerations addressed
- [ ] Documentation updated
- [ ] Changelog entry added

**Red Flags:**
- Missing tests for critical paths
- Complex logic without comments
- Security shortcuts (disabled validation, etc.)
- Accessibility violations
- Political bias in examples/naming
- Type safety compromises

---

## Integration Points

### GitHub Copilot Integration

**Context Awareness:**
GitHub Copilot automatically receives context from:
- `.github/copilot-instructions.md` (1566 lines of guidance)
- Recently indexed code (via ai-index/)
- Context bundles in `tools/ai/context-bundles/`

**Best Practices:**
1. Keep context bundles updated (weekly refresh)
2. Use descriptive comments to guide suggestions
3. Review suggestions against security/accessibility standards
4. Verify neutrality in generated political content
5. Add tests for AI-generated code

---

### CI/CD Pipeline Integration

**Workflow Execution:**

**On Every PR:**
- ai-governance.yml runs 7 validation jobs
- Results posted as PR comments
- Failures block merge

**Nightly at 2 AM UTC:**
- ai-maintenance.yml rebuilds indices
- Updates context bundles
- Assesses competence trends
- Publishes artifacts

**Pre-Commit Locally:**
- Lefthook runs 3 AI validation hooks
- Warnings logged, commit proceeds
- Index updated on pre-push

**Visual:**
```
┌─────────────────────────────────────┐
│  Developer Workflow                 │
├─────────────────────────────────────┤
│  git commit → Pre-commit hooks      │
│               ├─ AI neutrality      │
│               ├─ Semantic quality   │
│               └─ Competence quick   │
│                                     │
│  git push → Pre-push hooks          │
│             └─ Update AI index      │
│                                     │
│  Create PR → CI workflows           │
│              └─ ai-governance.yml   │
│                 ├─ 7 validation jobs│
│                 └─ PR comments      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Automated Maintenance              │
├─────────────────────────────────────┤
│  Nightly → ai-maintenance.yml       │
│            ├─ Rebuild indices       │
│            ├─ Refresh context       │
│            ├─ Competence assessment │
│            └─ Publish artifacts     │
└─────────────────────────────────────┘
```

---

## Metrics and Dashboards

### Key Metrics

**View Current Competence Score:**
```bash
cat ai-metrics/stats.json | jq '.competenceScore'
# Target: >0.7
```

**View Competence Trend:**
```bash
cat ai-metrics/stats.json | jq '.history[] | {date, score}'
```

**View AI Tool Performance:**
```bash
cat ai-metrics/performance.json | jq
```

**View Index Health:**
```bash
cat ai-index/metadata.json | jq '{files, size, lastUpdated}'
```

---

### Grafana Dashboard (Future)

**Planned Panels:**
1. Competence Score Trend (30 days)
2. AI Tool Latency (p50/p95/p99)
3. Cache Hit Rate
4. Workflow Success Rate
5. Neutrality Violations Trend
6. Index Update Status

**Access:** `http://localhost:3000/dashboards/ai-system-health`

---

## Getting Help

### Troubleshooting Decision Tree

```
AI tool not working?
├─ Run smoke test: bash tools/scripts/ai/smoke.sh
│  ├─ All pass → Check specific tool docs
│  └─ Some fail → See ai-maintenance-sop.md troubleshooting
│
├─ Search returns no results?
│  ├─ Check index exists: ls -la ai-index/
│  ├─ Rebuild index: npm run ai:index build --full
│  └─ Validate: npm run ai:index validate
│
├─ Competence score low?
│  ├─ Review recent commits for quality issues
│  ├─ Improve test coverage
│  ├─ Refresh context: npm run ai:refresh
│  └─ See ai-maintenance-sop.md competence section
│
└─ CI workflow failing?
   ├─ Check workflow logs: gh run view <id> --log
   ├─ Review job-specific troubleshooting in SOP
   └─ Escalate per SOP escalation procedures
```

---

### Documentation Resources

| Question | Resource |
|----------|----------|
| How do AI tools work? | `tools/scripts/ai/README.md` |
| What's the operational status? | `tools/scripts/ai/AI_TOOLS_STATUS.md` |
| How to maintain AI systems? | `docs/05-engineering-and-devops/sops/ai-maintenance-sop.md` |
| What are the governance rules? | `docs/07-ai-and-simulation/ai-governance.md` |
| How to use GitHub Copilot? | `.github/copilot-instructions.md` |
| What's on the TODO? | `docs/TODO.md` |

---

### Escalation Path

**Issue Severity:**
- **P0 (Critical):** AI system completely down >1hr → Page on-call
- **P1 (High):** Major functionality broken → Create high-priority issue
- **P2 (Medium):** Degraded performance → Weekly review
- **P3 (Low):** Feature request → Quarterly planning

**Contacts:**
- AI System Steward: Lead Developer
- On-Call Engineer: Rotation schedule
- TGC: Technical Governance Committee

---

## Best Practices Summary

**DO:**
- ✅ Keep AI context updated (weekly minimum)
- ✅ Review AI-generated code before committing
- ✅ Run smoke tests after major changes
- ✅ Monitor competence score trends
- ✅ Use neutral terminology in all code
- ✅ Include tests for AI-generated features
- ✅ Document AI assistance in commit messages

**DON'T:**
- ❌ Bypass AI validation checks without justification
- ❌ Commit AI-generated code without review
- ❌ Ignore declining competence scores
- ❌ Use real political examples in code/tests
- ❌ Disable security checks to "fix" AI warnings
- ❌ Skip context refresh for >2 weeks
- ❌ Ignore AI tool failures in CI

---

**Last Updated:** 2025-11-14  
**Next Review:** 2025-12-14  
**Maintained By:** Technical Governance Committee
