# Testing SOP

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `1.0.0` |  2025-11-18  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Purpose

This Standard Operating Procedure (SOP) defines the testing strategy for Political Sphere, ensuring comprehensive coverage of functionality, security, accessibility, and performance while maintaining enterprise-grade quality standards.

## Scope

Applies to all code changes, features, and releases across all applications (API, web, worker, game-server) and libraries.

## Prerequisites

- Code compiles without TypeScript errors
- Linting passes (ESLint, Biome)
- Basic unit tests pass locally
- Code follows project coding standards

## Test Pyramid Strategy

### Unit Tests (Foundation - 70%)

- Test individual functions, components, and modules in isolation
- Mock external dependencies (API calls, database, file system)
- Focus on business logic and edge cases
- Target: 80%+ coverage for critical paths
- Execution: < 50ms per test

### Integration Tests (Middle - 20%)

- Test interactions between modules and services
- Use test databases or in-memory databases
- Validate API contracts and data flows
- Include database operations and external service calls
- Execution: < 500ms per test

### End-to-End Tests (Top - 10%)

- Test complete user journeys through the application
- Validate real-world scenarios and workflows
- Run against staging environment
- Focus on critical paths (authentication, voting, governance)
- Execution: < 30 seconds per test

## Specialized Testing Requirements

### Security Testing

- [ ] Input validation testing (XSS, SQL injection prevention)
- [ ] Authentication and authorization testing
- [ ] Rate limiting and abuse prevention testing
- [ ] Data sanitization and encryption testing
- [ ] OWASP Top 10 vulnerability testing

### Accessibility Testing (WCAG 2.2 AA)

- [ ] Automated axe-core scanning for all UI changes
- [ ] Keyboard navigation testing
- [ ] Screen reader compatibility testing
- [ ] Color contrast ratio validation
- [ ] Focus management and tab order testing

### Performance Testing

- [ ] API response time validation (p95 < 200ms, p99 < 500ms)
- [ ] Load testing for critical endpoints
- [ ] Memory leak detection
- [ ] Bundle size monitoring
- [ ] Database query performance testing

### Political Neutrality Testing

- [ ] Bias detection in content and examples
- [ ] Balanced data representation testing
- [ ] Neutral language validation
- [ ] Constitutional compliance verification

## Test Execution Process

### Local Development

- [ ] Run unit tests before committing: `npm test:unit`
- [ ] Run integration tests for changed modules: `npm test:integration`
- [ ] Run accessibility tests for UI changes: `npm test:a11y`
- [ ] Verify test coverage meets thresholds

### Pre-Commit Hooks

- [ ] Automatic test execution via lefthook
- [ ] Block commits if critical tests fail
- [ ] Allow commits with `--no-verify` only for documentation changes

### CI/CD Pipeline

- [ ] Unit and integration tests on every push
- [ ] E2E tests on pull request to main
- [ ] Security scanning integrated
- [ ] Accessibility scanning for UI changes
- [ ] Performance benchmarks on critical paths
- [ ] Coverage reporting and thresholds

## Test Data Management

- [ ] Use synthetic data that mimics production
- [ ] Never use real user data in tests
- [ ] Implement test data factories (Fishery/Faker)
- [ ] Clean up test data after each test run
- [ ] Version test data alongside code changes

## Test Failure Response

### Immediate Actions

- [ ] Identify failure cause (code bug, test issue, environment)
- [ ] Quarantine flaky tests temporarily
- [ ] Fix underlying issues within 24 hours
- [ ] Update test expectations if requirements changed

### Escalation Criteria

- Escalate to team lead if:
  - Test failures block deployment
  - Coverage drops below 75%
  - Security test failures
  - Accessibility violations introduced

## Test Maintenance

- [ ] Review and update tests with code changes
- [ ] Remove obsolete tests when features are removed
- [ ] Refactor tests for maintainability
- [ ] Document complex test scenarios
- [ ] Regular test suite performance monitoring

## Metrics and Reporting

Track:

- Test pass/fail rates
- Test execution time trends
- Code coverage over time
- Flaky test detection
- Test maintenance cost

## Related Documentation

- [Testing Infrastructure](./testing.md)
- [Code Review SOP](./code-review-sop.md)
- [Security Standards](../../06-security-and-risk/security.md)
- [Accessibility Guidelines](../../10-user-experience/accessibility.md)

---

**Document Owner:** Engineering Team
**Review Date:** February 18, 2026
**Approval Date:** November 18, 2025
