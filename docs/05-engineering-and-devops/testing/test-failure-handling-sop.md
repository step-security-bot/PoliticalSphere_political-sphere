# Test Failure Handling Standard Operating Procedure (SOP)

<div align="center">

| Classification | Version | Last Updated |         Owner          | Review Cycle |    Status    |
| :------------: | :-----: | :----------: | :--------------------: | :----------: | :----------: |
|  🔒 Internal   | `1.0.0` |  2025-11-18  | Quality Assurance Team |  Quarterly   | **Approved** |

</div>

---

## 1. Purpose

To define strict, machine-executable rules governing how failing tests must be analyzed and resolved. The objective is to ensure behavioral correctness, prevent masking of defects, maintain tests as authoritative system specifications, and continuously improve testing effectiveness through measurable metrics and audit trails.

This SOP aligns with WCAG 2.2 AA accessibility standards, zero-trust security principles, and GDPR compliance for data handling in test environments.

## 2. Scope

Applies to all automated tests (unit, integration, E2E, accessibility, security, performance) across the Political Sphere monorepo. Covers CI/CD pipelines, local development, and manual test execution.

## 3. Core Principles

### 3.1 Authoritative Standard

By default, a failing test indicates a defect in the System Under Test (SUT).
A test may only be modified if there is proven, self-contained defect in the test code itself.

Tests are normative specifications. The SUT must conform to them unless the test is demonstrably incorrect.

### 3.2 Default Assumption

- **SUT_DEFECT** is the default classification unless proven otherwise.
- Burden of proof lies with demonstrating TEST_DEFECT.
- No test may be skipped, bypassed, or weakened without explicit governance approval.

### 3.3 Continuous Improvement

All failure analyses contribute to metrics tracking and process refinement.

## 4. Process Logic

### 4.1 Initial Failure Intake

When a test fails:

```pseudocode
fail_event := capture(test_name, error, stack_trace, logs, timestamp, environment)
notify_team(fail_event)
create_incident_ticket(fail_event)
```

Proceed to diagnostic classification within 1 hour of failure detection.

### 4.2 Root Cause Classification

Classify the failure into one of the following categories:

- **A: SUT_DEFECT** (Default Case)
- **B: TEST_DEFECT** (Exceptional Case - requires proof)
- **C: ENVIRONMENT_DEFECT** (Infrastructure/configuration issue)
- **D: FLAKY_TEST** (Intermittent failure requiring investigation)

#### Classification Criteria

**A. SUT_DEFECT (Default Case)**

Classify as SUT_DEFECT if any of the following are true:

- The SUT's output deviates from the test's expected behavior.
- A dependency, configuration, or environmental value is incorrect.
- The behavior under test is incomplete, inconsistent, or faulty.
- The test appears correct and deterministic.
- Accessibility violations (WCAG 2.2 AA non-compliance).
- Security vulnerabilities detected.

**Action:**

```pseudocode
fix(SUT)
verify(test passes)
run_full_suite()
document_fix(incident_ticket)
update_metrics(time_to_resolution, false_positive_rate)
```

**B. TEST_DEFECT (Exceptional Case)**

Classify as TEST_DEFECT only if there is clear, reproducible evidence of a defect in the test itself:

- Incorrect or contradictory assertions
- Incorrect test logic or flow
- Broken mocks, fakes, stubs, or spies
- Faulty fixtures or setup/teardown routines
- Typographical errors causing mis-evaluation
- Tests asserting behaviors that contradict documented specifications
- Missing or incorrect accessibility test configurations

**Action:**

```pseudocode
fix(test_code)
verify(test_correctness)
run_full_suite()
document_fix(incident_ticket)
update_metrics(test_defect_rate)
```

**C. ENVIRONMENT_DEFECT**

Classify as ENVIRONMENT_DEFECT if:

- CI/CD infrastructure issues (e.g., resource constraints, network failures)
- Test environment misconfigurations
- Dependency version conflicts
- Database or external service unavailability

**Action:**

```pseudocode
fix_environment()
re_run_test()
if persistent: escalate_to_infrastructure_team()
```

**D. FLAKY_TEST**

Classify as FLAKY_TEST if:

- Test passes on re-run without code changes
- Race conditions or timing dependencies
- External service instability

**Action:**

```pseudocode
investigate_root_cause()
implement_retry_logic(max_retries=3)
monitor_failure_rate()
if >5% failure rate: quarantine_test()
```

If evidence is inconclusive → default back to A: SUT_DEFECT.

### 4.3 Escalation Procedures

#### Level 1: Developer/AI Assistant (Immediate - <1 hour)

- Perform initial classification and fix attempt
- Document findings in incident ticket

#### Level 2: Senior Developer/Tech Lead (If unresolved - <4 hours)

- Review classification and fix approach
- Consult architectural decisions (ADRs)
- May override default assumption with governance approval

#### Level 3: Technical Governance Committee (TGC) (If constitutional/security concern - <24 hours)

- Review for compliance with democratic integrity, security, accessibility
- Required for any test modifications affecting voting, speech, or power distribution
- May authorize exceptional test changes

#### Level 4: Executive Escalation (If blocking production deployment - <72 hours)

- Business impact assessment
- May authorize temporary workarounds with rollback plans

### 4.4 Documentation Requirements

Every failure analysis must include:

- **Failure Report**: Structured JSON log with all capture data
- **Classification Rationale**: Step-by-step reasoning with evidence
- **Fix Details**: Code changes, before/after states
- **Verification Steps**: How fix was validated
- **Lessons Learned**: Process improvements identified
- **Audit Trail**: Tamper-evident record of all decisions and approvals

### 4.5 Training and Awareness

- **Mandatory Training**: All team members complete annual SOP training
- **Documentation**: SOP accessible in `docs/05-engineering-and-devops/testing/`
- **Awareness Campaigns**: Quarterly reminders and case study reviews
- **Certification**: Developers must demonstrate SOP understanding before contributing to critical paths

## 5. Prohibited Actions (Absolute Rules)

The AI must never take these actions unless explicitly authorized by higher governance:

- DO NOT skip tests
- DO NOT bypass tests
- DO NOT weaken assertions
- DO NOT modify expected values without verified justification
- DO NOT delete tests to force a pass
- DO NOT rewrite tests only to silence failures
- DO NOT disable security or accessibility checks
- DO NOT ignore flaky tests without investigation

Any such action constitutes a violation of this SOP and triggers immediate escalation.

## 6. Compliance Enforcement

### 6.1 AI Execution Contract

All automated systems must apply the following mandatory logic:

```pseudocode
IF test_fails AND no proven TEST_DEFECT:
    fix(SUT)
ELSE IF proven TEST_DEFECT:
    fix(test_code)
ELSE IF environment_defect:
    fix_environment()
ELSE IF flaky_test:
    investigate_and_retry()
ELSE:
    classify_as(SUT_DEFECT)

ALWAYS:
    document_analysis()
    run_full_suite()
    update_metrics()
    audit_trail()
```

### 6.2 Verification Requirements

Every fix (SUT or test) must be followed by:

- `run_full_suite()` - Complete test execution
- `confirm_no_regressions()` - Impact analysis
- `performance_validation()` - Benchmarks meet targets
- `accessibility_audit()` - WCAG 2.2 AA compliance
- `security_scan()` - No new vulnerabilities introduced

### 6.3 Exception Handling

Rare cases where default assumption may be overridden:

- **Constitutional Override**: TGC approval for changes affecting core democratic processes
- **Security Emergency**: Immediate threat requiring temporary test bypass (with rollback plan)
- **Infrastructure Catastrophe**: Complete system unavailability preventing testing

All exceptions require:

- Written justification
- Risk assessment
- Rollback plan
- Post-incident review

## 7. Metrics and KPIs

### 7.1 Effectiveness Metrics

- **Time to Resolution**: Average time from failure to fix (target: <2 hours for critical)
- **False Positive Rate**: Percentage of SUT_DEFECT classifications that were actually TEST_DEFECT (target: <5%)
- **Test Defect Rate**: Percentage of failures classified as TEST_DEFECT (target: <10%)
- **Regression Rate**: Tests failing after unrelated changes (target: <1%)

### 7.2 Process Metrics

- **Classification Accuracy**: Verified through peer review (target: >95%)
- **Documentation Completeness**: All required fields present (target: 100%)
- **Escalation Rate**: Percentage requiring Level 2+ review (target: <20%)

### 7.3 Continuous Monitoring

- **Dashboard**: Real-time metrics in observability platform
- **Alerts**: Automatic notification for KPI breaches
- **Quarterly Reviews**: Trend analysis and process improvements
- **Annual Audits**: Independent verification of SOP compliance

## 8. Integration with CI/CD

### 8.1 Automated Gates

- **Pre-Merge**: All tests must pass or be properly classified
- **Post-Merge**: Full suite execution with failure blocking deployment
- **Rollback Triggers**: Automatic rollback on critical test failures
- **Notification**: Slack/email alerts for all failures with classification

### 8.2 Tool Integration

- **Vitest/Jest**: Custom reporters for structured failure capture
- **GitHub Actions**: Automated incident creation and assignment
- **Observability**: Integration with OpenTelemetry for tracing
- **Security Tools**: SCA and SAST results influence classification

## 9. Audit Trail Requirements

### 9.1 Tamper-Evident Records

- **Immutable Logs**: All decisions logged with cryptographic signatures
- **Chain of Custody**: Clear record of who reviewed/approved each step
- **Retention**: 7 years minimum for compliance-related failures
- **Export Capability**: Machine-readable audit logs for regulatory review

### 9.2 Compliance Verification

- **GDPR**: Test data anonymization and deletion capabilities
- **WCAG**: Accessibility test results included in audit trail
- **Security**: Vulnerability scan results archived
- **Neutrality**: Bias detection results for AI-generated tests

## 10. Performance Monitoring and Improvement

### 10.1 Process Optimization

- **Bottleneck Analysis**: Identify common failure patterns
- **Automation Opportunities**: Scripts for repetitive classification tasks
- **Training Gaps**: Areas where team knowledge needs improvement

### 10.2 Feedback Loops

- **Retrospectives**: Monthly review of failure patterns
- **Tool Improvements**: Enhance testing infrastructure based on pain points
- **Standard Updates**: Revise SOP based on lessons learned

## 11. Summary (Machine-Optimized)

Tests are authoritative specifications.

Failing tests → assume SUT is faulty unless proven otherwise.

Fix SUT first.

Fix tests only when they are demonstrably wrong.

Never alter a test to hide a real failure.

Document everything.

Re-verify the entire suite after any fix.

Monitor, measure, and improve continuously.

## 12. References

- **WCAG 2.2 AA**: Web Content Accessibility Guidelines
- **OWASP ASVS v5.0.0**: Application Security Verification Standard
- **NIST SP 800-53 r5**: Security and Privacy Controls
- **Project Governance**: `docs/02-governance/`
- **Testing Infrastructure**: `docs/05-engineering-and-devops/testing/`
- **CI/CD Standards**: `docs/05-engineering-and-devops/ci-cd-architecture.md`

## 13. Version History

| Version | Date       | Author   | Key Changes                                                 |
| ------- | ---------- | -------- | ----------------------------------------------------------- |
| 1.0.0   | 2025-11-18 | AI Agent | Initial release with comprehensive improvements and metrics |

---

**Approval**: Technical Governance Committee (TGC)
**Effective Date**: 2025-11-18
**Review Date**: 2026-02-18
