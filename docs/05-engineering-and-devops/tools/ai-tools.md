# AI-Powered Development Tools

This document catalogs all AI and automated tools integrated into Political Sphere's development workflow.

**Last Updated:** 2025-11-10  
**Version:** 1.0.0

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## 🎯 Active AI Tools

### 1. **GitHub Copilot** (Paid)

**Purpose:** AI-powered code completion and generation  
**Governance:** Comprehensive instructions in `.github/copilot-instructions.md`  
**Configuration:** See `copilot-instructions.md` for complete governance framework

**Key Guardrails:**

- Political neutrality enforcement
- Zero-trust security compliance
- WCAG 2.2 AA+ accessibility requirements
- Test-driven development mandates

---

### 2. **Dependabot** (Free - GitHub Native)

**Purpose:** Automated dependency updates and security alerts  
**Configuration:** `.github/dependabot.yml`  
**Coverage:**

- npm packages (weekly)
- GitHub Actions (weekly)
- Docker images (weekly)

**Features:**

- Automatic PR creation for updates
- Security vulnerability alerts
- Grouped updates to reduce PR noise

**Limits:** 10 open PRs for npm/actions, 5 for Docker

---

### 3. **CodeQL** (Free - GitHub Advanced Security)

**Purpose:** Static Application Security Testing (SAST)  
**Workflow:** `.github/workflows/security.yml` (job: `codeql-analysis`)  
**Languages:** JavaScript, TypeScript

**Detects:**

- SQL injection vulnerabilities
- Cross-site scripting (XSS)
- Command injection
- Path traversal
- Hardcoded credentials
- And 200+ other security patterns

**Integration:**

- Results appear in GitHub Security tab
- Blocks PRs on high-severity findings
- SARIF format for tool interoperability

**Aligns with:** SEC-01 to SEC-10 (Zero-trust security requirements)

---

### 4. **Codecov** (Free for Open Source)

**Purpose:** Test coverage tracking and visualization  
**Workflow:** `.github/workflows/ci.yml`  
**Configuration:** Requires `CODECOV_TOKEN` secret

**Features:**

- Coverage reports on every PR
- Visual diff showing coverage changes
- Trend tracking over time
- Identifies untested code paths

**Targets:**

- Minimum 80% coverage (project standard)
- 100% for security-critical code
- Blocks PRs that significantly reduce coverage

**Aligns with:** TEST-01 to TEST-06 (Testing requirements)

---

### 5. **Lighthouse CI** (Free)

**Purpose:** Performance, accessibility, and SEO auditing  
**Workflow:** `.github/workflows/lighthouse.yml` (NEW)  
**Configuration:** `.github/lighthouse/budget.json`

**Metrics Tracked:**

- 🚀 **Performance** (target: 90+)
  - First Contentful Paint < 1.5s
  - Largest Contentful Paint < 2.5s
  - Total Blocking Time < 300ms
- ♿ **Accessibility** (target: 100 - MANDATORY)
  - WCAG 2.2 AA+ compliance
  - Screen reader compatibility
  - Keyboard navigation
- ✨ **Best Practices** (target: 90+)
- 🔍 **SEO** (target: 80+)

**Performance Budgets:**

- Total bundle: 700KB
- JavaScript: 300KB
- CSS: 50KB
- Images: 200KB
- Fonts: 100KB

**Integration:**

- Runs on PRs affecting frontend code
- Posts results as PR comment
- **BLOCKS merge if accessibility < 100**
- Temporal public storage for reports

**Aligns with:**

- UX-01 to UX-05 (Accessibility requirements)
- OPS-01 to OPS-05 (Performance targets)

---

### 6. **Accessibility Testing** (axe-core via Playwright)

**Purpose:** Automated WCAG 2.2 AA+ compliance validation  
**Workflow:** `.github/workflows/ci.yml` (job: `accessibility-test`)  
**Script:** `npm run test:a11y`

**Checks:**

- Color contrast ratios (4.5:1 minimum)
- ARIA labels and roles
- Semantic HTML structure
- Keyboard navigation
- Focus management
- Screen reader compatibility

**Integration:**

- Runs on every PR
- Posts violations as PR comment
- Blocks merge on any violations
- Generates detailed JSON report

**Aligns with:** UX-01 to UX-05 (WCAG 2.2 AA+ mandatory)

---

### 7. **Semgrep** (Free Community Edition)

**Purpose:** Additional SAST scanning with custom rules  
**Workflow:** `.github/workflows/security.yml` (job: `semgrep-scan`)

**Rule Sets:**

- OWASP Top 10
- JavaScript/TypeScript security patterns
- React security best practices
- Node.js vulnerabilities

**Integration:**

- SARIF upload to GitHub Security tab
- Complements CodeQL with different detection algorithms

**Aligns with:** SEC-01 to SEC-10

---

### 8. **Snyk** (Free Tier - 200 Tests/Month)

**Purpose:** Dependency vulnerability scanning  
**Workflow:** `.github/workflows/security.yml` (referenced)  
**Configuration:** Requires `SNYK_TOKEN` secret

**Features:**

- Deeper dependency analysis than Dependabot
- License compliance checking
- Container image scanning
- Remediation advice

**Aligns with:** SEC-05 (Software Composition Analysis)

---

## 📊 AI Tool Summary

| Tool           | Type          | Cost | Primary Purpose          | Blocks PRs          |
| -------------- | ------------- | ---- | ------------------------ | ------------------- |
| GitHub Copilot | Code Gen      | Paid | Development acceleration | No                  |
| Dependabot     | Dependency    | Free | Security updates         | No                  |
| CodeQL         | SAST          | Free | Security scanning        | High severity       |
| Codecov        | Testing       | Free | Coverage tracking        | Significant drop    |
| Lighthouse CI  | Performance   | Free | Web vitals + a11y        | Accessibility < 100 |
| axe-core       | Accessibility | Free | WCAG validation          | Any violations      |
| Semgrep        | SAST          | Free | Security patterns        | High severity       |
| Snyk           | SCA           | Free | Vulnerability scan       | High severity       |

---

## 🚀 Usage Guidelines

### For Developers

**Before Starting Work:**

1. Review Copilot instructions: `.github/copilot-instructions.md`
2. Check active security alerts in Security tab
3. Review coverage trends in Codecov

**During Development:**

1. Use Copilot for boilerplate, following governance rules
2. Write tests alongside code (80%+ coverage)
3. Run `npm run test:a11y` locally before pushing

**Before Merging:**

1. All CI checks must pass (including AI-powered ones)
2. Resolve all CodeQL/Semgrep/Snyk findings
3. Ensure coverage doesn't drop
4. Lighthouse accessibility must be 100
5. No axe violations

### For Reviewers

**AI-Generated Code:**

- Verify compliance with `.github/copilot-instructions.md`
- Check for political neutrality
- Validate security practices
- Ensure accessibility standards

**Quality Gates:**

- CodeQL: No high-severity findings
- Codecov: Coverage maintained or increased
- Lighthouse: Accessibility = 100, Performance ≥ 90
- axe: Zero violations

---

## 🔧 Configuration Files

```
.github/
├── copilot-instructions.md          # Copilot governance
├── dependabot.yml                   # Dependency updates
├── lighthouse/
│   └── budget.json                  # Performance budgets
└── workflows/
    ├── security.yml                 # CodeQL, Semgrep, Snyk
    ├── ci.yml                       # Codecov, axe testing
    └── lighthouse.yml               # Lighthouse CI (NEW)
```

---

## 📈 Monitoring & Metrics

**GitHub Security Tab:**

- CodeQL findings
- Dependabot alerts
- Semgrep results
- Snyk vulnerabilities

**PR Comments:**

- Codecov coverage reports
- Lighthouse scores
- Accessibility violations

**Artifacts:**

- Coverage reports (Codecov UI)
- Lighthouse HTML reports
- Accessibility JSON reports

---

## 🎓 Training Resources

**New to these tools?**

1. **Copilot:** Read `.github/copilot-instructions.md` completely
2. **CodeQL:** [GitHub Learning Lab](https://lab.github.com/githubtraining/codeql-u-boot-challenge)
3. **Lighthouse:** [web.dev/measure](https://web.dev/measure/)
4. **axe:** [deque.com/axe/devtools](https://www.deque.com/axe/devtools/)

---

## 🛠️ Troubleshooting

### Dependabot Issues

```bash
# Check for conflicting PRs
gh pr list --label dependencies

# Manually trigger update
gh workflow run dependabot.yml
```

### CodeQL False Positives

Add suppression comment in code:

```typescript
// codeql[js/sql-injection]
// Justification: Input is sanitized by Zod schema
```

### Lighthouse Failures

```bash
# Run locally
npm install -g @lhci/cli
lhci autorun --config=.github/lighthouse/budget.json
```

### Coverage Drops

```bash
# Generate local coverage report
npm run test:coverage

# Check untested files
open coverage/index.html
```

---

## 🔮 Future Enhancements

**Under Consideration:**

- **Renovate Bot:** More advanced dependency management
- **SonarCloud:** Code quality + technical debt tracking
- **Playwright Test Generator:** AI-powered test generation
- **GitHub Copilot Workspace:** Multi-file AI edits

**Not Recommended:**

- Multiple AI code generators (Copilot is sufficient)
- Generic auto-documentation tools (manual docs are better)
- AI commit message generators (undermines accountability)

---

## 📞 Support

**Issues with AI tools?**

1. Check workflow logs in Actions tab
2. Review this document for configuration details
3. Check tool-specific documentation (links above)
4. Create issue with `ai-tooling` label

**Updating this document?**

Follow governance procedures in `docs/document-control/`

---

## ✅ Compliance Mapping

| Requirement                          | Tool(s)               | Status    |
| ------------------------------------ | --------------------- | --------- |
| SEC-01 to SEC-10 (Security)          | CodeQL, Semgrep, Snyk | ✅ Active |
| TEST-01 to TEST-06 (Testing)         | Codecov, Playwright   | ✅ Active |
| UX-01 to UX-05 (Accessibility)       | Lighthouse, axe-core  | ✅ Active |
| OPS-01 to OPS-05 (Performance)       | Lighthouse CI         | ✅ Active |
| AIGOV-01 to AIGOV-07 (AI Governance) | Copilot Instructions  | ✅ Active |
| COMP-01 to COMP-05 (Compliance)      | All tools combined    | ✅ Active |

---

**Document Control:**

- **Owner:** Technical Governance Committee
- **Review Frequency:** Quarterly
- **Next Review:** 2026-02-10
