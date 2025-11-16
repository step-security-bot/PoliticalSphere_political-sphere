# PR Merge SOP

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `1.0.0` |  2025-11-14  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

## Purpose

This SOP outlines the process for merging pull requests (PRs) in the Political Sphere project, ensuring all quality gates are passed and changes are production-ready.

## Scope

Applies to all PRs targeting main/master branches and release branches.

## Prerequisites

- PR approved by required reviewers
- All automated checks passing
- Code review checklist completed
- Testing completed and documented

## PR Merge Checklist

### Pre-Merge Verification
- [ ] **CI/CD Status**: All workflows pass (build, test, lint, security)
- [ ] **Code Review**: Approved by at least 1 reviewer (2 for critical changes)
- [ ] **Testing**: Unit tests pass, coverage meets 80% threshold
- [ ] **Security**: SAST/DAST scans pass, no critical vulnerabilities
- [ ] **Accessibility**: Automated WCAG checks pass
- [ ] **Type Safety**: TypeScript compilation succeeds with strict mode

### Documentation Updates
- [ ] **CHANGELOG.md**: Entry added for user-facing changes
- [ ] **API Documentation**: Updated for API changes
- [ ] **README Updates**: New features or setup changes documented
- [ ] **ADR Updates**: Architectural decisions documented if applicable

### Branch Management
- [ ] **Branch Naming**: Follows project conventions (feature/, bugfix/, hotfix/)
- [ ] **Commit Messages**: Clear, descriptive commits following conventional format
- [ ] **Rebase Required**: PR rebased on latest target branch
- [ ] **Conflicts Resolved**: No merge conflicts present

### Deployment Readiness
- [ ] **Feature Flags**: New features behind flags if needed
- [ ] **Database Migrations**: Safe rollback plans documented
- [ ] **Environment Config**: Changes tested in staging
- [ ] **Rollback Plan**: Documented and tested

## Merge Process

### Step 1: Final Verification
- [ ] Confirm all checklist items complete
- [ ] Verify no outstanding review comments
- [ ] Check for breaking changes and communication plan
- [ ] Ensure deployment window available

### Step 2: Merge Execution
- [ ] Use "Squash and merge" for clean history
- [ ] Write clear merge commit message
- [ ] Delete source branch after merge
- [ ] Monitor post-merge CI pipeline

### Step 3: Post-Merge Actions
- [ ] Deploy to staging for final validation
- [ ] Monitor error rates and performance
- [ ] Communicate changes to stakeholders
- [ ] Update project status boards

## Blocking Conditions

PR cannot be merged if:
- Critical security vulnerabilities present
- Breaking changes without migration plan
- Accessibility violations (WCAG AA)
- Test coverage below 80%
- Required approvals not obtained

## Escalation Paths

- **Security Issues**: Escalate to security team
- **Breaking Changes**: Require product owner approval
- **Performance Regressions**: Require engineering manager approval
- **Legal Concerns**: Escalate to legal team

## Metrics Tracking

- Merge time from approval (target: < 1 hour)
- Post-merge defect rate
- Rollback frequency
- Stakeholder satisfaction

## Related Documentation

- [Code Review SOP](./code-review-sop.md)
- [Deployment SOP](./deployment-sop.md)
- [Testing Standards](./testing.md)

---

**Document Owner:** Engineering Team
**Review Date:** February 14, 2026
**Approval Date:** November 14, 2025
