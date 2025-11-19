# Risk Register

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Overview

This risk register documents identified risks to the Political Sphere platform, their likelihood, impact, and mitigation strategies. Risks are linked to relevant ADRs where architectural decisions address them.

## Risk Assessment Methodology

- **Likelihood**: Low (1-2), Medium (3-4), High (5-6)
- **Impact**: Low (1-2), Medium (3-4), High (5-6)
- **Risk Score**: Likelihood × Impact
- **Thresholds**: Low (<6), Medium (6-12), High (13-20), Critical (21-36)

## Current Risks

### SEC-1: Secrets Management Exposure

- **Description**: Reliance on GitHub secrets for production credentials increases risk of credential leakage
- **Likelihood**: Medium (4)
- **Impact**: High (6)
- **Risk Score**: 24 (Critical)
- **Status**: Open
- **Owner**: CTO
- **Mitigation**:
  - Implement HashiCorp Vault integration (ADR-0002)
  - Rotate all credentials quarterly
  - Implement secret scanning in CI/CD
- **Linked ADR**: ADR-0002 (Secrets Management Strategy)
- **Last Reviewed**: 2025-10-28

### DEP-1: Dependency Vulnerabilities

- **Description**: Outdated dependencies may contain security vulnerabilities
- **Likelihood**: High (5)
- **Impact**: High (6)
- **Risk Score**: 30 (Critical)
- **Status**: Open (Renovate bot disabled)
- **Owner**: Platform Team
- **Mitigation**:
  - Enable Renovate bot for automated updates
  - Security updates auto-merged
  - Weekly dependency audits
- **Linked ADR**: ADR-0001 (Enable Renovate)
- **Last Reviewed**: 2025-10-28

### PERF-1: Performance Degradation

- **Description**: API performance may degrade under load, affecting user experience
- **Likelihood**: Medium (4)
- **Impact**: Medium (4)
- **Risk Score**: 16 (High)
- **Status**: Mitigated (Perf smoke gate implemented)
- **Owner**: DevOps Team
- **Mitigation**:
  - Performance smoke tests in CI/CD
  - Monitoring alerts for response times >500ms
  - Load testing before major releases
- **Linked ADR**: ADR-0004 (Performance Monitoring)
- **Last Reviewed**: 2025-10-28

### COMP-1: EU AI Act Non-Compliance

- **Description**: AI systems may not comply with EU AI Act requirements
- **Likelihood**: Low (2)
- **Impact**: High (6)
- **Risk Score**: 12 (Medium)
- **Status**: Open (Compliance documentation incomplete)
- **Owner**: Compliance Officer
- **Mitigation**:
  - Conduct full AI Act compliance assessment
  - Document AI systems and risk classifications
  - Implement required transparency measures
  - Set up data governance for training data
  - Add compliance monitoring to CI/CD
  - Create compliance reporting process
- **Linked ADR**: ADR-0005 (AI Governance)
- **Last Reviewed**: 2025-10-28

### TEST-1: Insufficient Test Coverage

- **Description**: Low test coverage may allow bugs to reach production
- **Likelihood**: Medium (4)
- **Impact**: Medium (4)
- **Risk Score**: 16 (High)
- **Status**: Open (Integration and contract tests missing)
- **Owner**: QA Team
- **Mitigation**:
  - Implement integration test suite
  - Add contract testing with Pact
  - Coverage thresholds enforced in CI
  - Self-healing test framework fixes
- **Linked ADR**: ADR-0006 (Testing Strategy)
- **Last Reviewed**: 2025-10-28

### AI-ETHICS-1: AI Bias and Ethical Concerns

- **Description**: AI systems may exhibit bias or generate unethical content
- **Likelihood**: Medium (3)
- **Impact**: High (5)
- **Risk Score**: 15 (High)
- **Status**: Mitigated (Ethics controls implemented)
- **Owner**: AI Governance Team
- **Mitigation**:
  - Bias detection algorithms implemented
  - Content filtering for neutrality
  - Ethical review processes established
  - Regular ethics audits conducted
- **Linked ADR**: ADR-0005 (AI Governance)
- **Last Reviewed**: 2024-12-19

### GOV-2: Risk Traceability Gaps

- **Description**: Risks not systematically linked to ADRs and decisions
- **Likelihood**: Low (2)
- **Impact**: Low (3)
- **Risk Score**: 6 (Low)
- **Status**: Mitigated (Risk register created and linked)
- **Owner**: Governance Team
- **Mitigation**:
  - Risk register documents all risks with ADR links
  - Risk assessment process for new features
  - Regular risk reviews integrated into development
  - Automated risk tracking in CI/CD
- **Linked ADR**: N/A
- **Last Reviewed**: 2025-10-28

### AI-COMPLIANCE-1: EU AI Act Non-Compliance

- **Description**: AI systems may not comply with EU AI Act requirements
- **Likelihood**: Low (2)
- **Impact**: High (6)
- **Risk Score**: 12 (Medium)
- **Status**: Mitigated (Compliance documentation completed)
- **Owner**: Compliance Officer
- **Mitigation**:
  - AI Act compliance documentation
  - Regular compliance reviews
  - AI system inventory maintained
  - High-risk system classification completed
- **Linked ADR**: ADR-0005 (AI Governance)
- **Last Reviewed**: 2024-12-19

### PROD-1: Production Deployment Failures

- **Description**: Deployment to production may fail due to configuration issues or environment differences
- **Likelihood**: Medium (4)
- **Impact**: High (5)
- **Risk Score**: 20 (High)
- **Status**: Open
- **Owner**: DevOps Team
- **Mitigation**:
  - Blue-green deployment strategy implemented
  - Automated smoke tests post-deployment
  - Staging environment mirroring production
  - Rollback procedures documented and tested
  - Feature flags for gradual rollouts
- **Linked ADR**: ADR-0009 (Canary Deployment Strategy)
- **Last Reviewed**: 2025-11-19

### PROD-2: Data Loss During Deployment

- **Description**: Database migrations or deployment processes may cause data loss
- **Likelihood**: Low (2)
- **Impact**: Critical (6)
- **Risk Score**: 12 (Medium)
- **Status**: Mitigated (Migration safety implemented)
- **Owner**: Database Team
- **Mitigation**:
  - Database backups before all deployments
  - Migration rollback procedures
  - Schema change validation in staging
  - Data integrity checks post-migration
  - Point-in-time recovery capability
- **Linked ADR**: ADR-0007 (Database Migration Strategy)
- **Last Reviewed**: 2025-11-19

### PROD-3: Monitoring Blind Spots

- **Description**: Insufficient monitoring may delay detection of production issues
- **Likelihood**: Medium (3)
- **Impact**: High (5)
- **Risk Score**: 15 (High)
- **Status**: Open
- **Owner**: SRE Team
- **Mitigation**:
  - Comprehensive observability stack (logs, metrics, traces)
  - Alerting on key SLOs (availability, latency, error rate)
  - Synthetic monitoring for critical user journeys
  - Log aggregation and correlation
  - On-call rotation with escalation procedures
- **Linked ADR**: ADR-0004 (Performance Monitoring)
- **Last Reviewed**: 2025-11-19

### PROD-4: Scalability Limitations

- **Description**: System may not scale to handle production traffic levels
- **Likelihood**: Medium (3)
- **Impact**: Medium (4)
- **Risk Score**: 12 (Medium)
- **Status**: Open
- **Owner**: Platform Team
- **Mitigation**:
  - Load testing completed before production
  - Horizontal scaling capability implemented
  - Auto-scaling policies configured
  - Performance monitoring and alerting
  - CDN integration for static assets
- **Linked ADR**: ADR-0008 (Scalability and Performance)
- **Last Reviewed**: 2025-11-19

## Risk Monitoring

### Review Cadence

- **Critical Risks**: Weekly review
- **High Risks**: Monthly review
- **Medium Risks**: Quarterly review
- **Low Risks**: Annual review

### Escalation Process

1. Risk identified → Document in register
2. Risk assessed → Assign owner and mitigation
3. Risk monitored → Regular status updates
4. Risk escalated → If score increases, notify stakeholders

### Reporting

- Monthly risk report to executive team
- Risk dashboard in project documentation
- Automated alerts for risk score changes

## Risk Acceptance Criteria

- **Acceptable Risk**: Score ≤ 12 (Medium or lower)
- **Conditional Acceptance**: Score 13-20 with mitigation plan
- **Unacceptable Risk**: Score > 20 requires immediate action

## Change History

| Date       | Change                                                                 | Author |
| ---------- | ---------------------------------------------------------------------- | ------ |
| 2025-11-19 | Added PROD-1, PROD-2, PROD-3, PROD-4 production deployment risks       | CTO    |
| 2025-10-28 | Initial risk register created                                          | CTO    |
| 2025-10-28 | Added SEC-1, DEP-1, PERF-1, COMP-1, TEST-1                             | CTO    |
