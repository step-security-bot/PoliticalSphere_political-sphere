# Production Readiness Checklist

**Project:** Political Sphere  
**Version:** 1.0  
**Last Updated:** October 29, 2025

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Owners & Contacts

- **SRE / On-call:** SRE Team — oncall@sre.political-sphere.example
- **Security owner:** security-team@political-sphere.example
- **Product / Release owner:** product-ops@political-sphere.example
- **Runbook location:** ./docs/09-observability-and-ops/operations.md

## Service Level Objectives (SLOs) & Acceptance Criteria

These acceptance criteria are required before production rollout. Concrete SLOs below must be added to the service SLA and validated by tests and observability dashboards.

- Availability (p99): 99.9% (target)
- Latency (p95): < 200ms for core API requests
- Error rate: < 1% (5xx responses) over rolling 5m window
- Data persistence: Backups verified with successful restore test at least weekly
- Recovery: RTO <= 4 hours, RPO <= 1 hour

Verification steps (smoke):

1. Run `scripts/ci/test-smoke.sh` against staging.
2. Verify CloudWatch/Prometheus dashboards for latency and error-rate baselines.
3. Run a backup-and-restore validation job and confirm data integrity.

## Pre-Deployment Checklist

### 🔐 Security (CRITICAL)

#### Authentication & Authorization

- [ ] JWT authentication implemented
- [ ] Session management configured
- [ ] Password hashing with bcrypt (min. 10 rounds)
- [ ] Multi-factor authentication available
- [ ] Role-based access control (RBAC) implemented
- [ ] API key rotation policy in place
- [ ] OAuth2/OIDC integration (if applicable)

#### Input Validation & Sanitization

- [x] All user inputs validated
- [x] XSS prevention measures in place
- [x] SQL injection prevention (parameterized queries)
- [x] Path traversal prevention
- [x] Command injection prevention
- [x] HTML sanitization for user content
- [x] File upload validation and size limits

#### Security Headers

- [x] Strict-Transport-Security (HSTS)
- [x] Content-Security-Policy (CSP)
- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: DENY
- [x] X-XSS-Protection
- [x] Referrer-Policy
- [x] Permissions-Policy

#### CORS Configuration

- [x] Whitelist-based origin validation
- [x] Credentials handling configured
- [x] Preflight requests handled correctly
- [ ] Production origins configured (update before deploy)

#### Rate Limiting

- [x] Per-IP rate limiting implemented
- [ ] Per-user rate limiting (requires auth)
- [x] Rate limit headers included
- [x] 429 responses with Retry-After
- [ ] Redis-based rate limiting for production

#### Secrets Management

- [x] No secrets in code
- [x] No secrets in git history
- [x] .env files in .gitignore
- [ ] Production secrets in AWS Secrets Manager
- [ ] Secrets rotation policy defined
- [x] Example .env has warnings

#### Encryption

- [ ] Data at rest encryption (KMS)
- [ ] Data in transit encryption (TLS 1.3)
- [ ] Database encryption enabled
- [ ] S3 bucket encryption enabled
- [ ] PII field-level encryption

#### Vulnerability Management

- [x] npm audit shows 0 vulnerabilities
- [x] Dependency scanning (Renovate)
- [x] Docker image scanning (Trivy)
- [x] SAST scanning (CodeQL, Semgrep)
- [ ] DAST scanning scheduled
- [ ] Penetration testing completed

#### Compliance

- [x] security.txt file created
- [ ] Privacy policy published
- [ ] Cookie policy published
- [ ] GDPR compliance documented
- [ ] Data retention policy defined
- [ ] Right to erasure implemented
- [ ] Data portability implemented

---

### 🏗️ Infrastructure

#### Docker Security

- [x] Running as non-root user
- [x] Multi-stage builds
- [x] Minimal base images (Alpine)
- [x] .dockerignore configured
- [x] Health checks defined
- [ ] Resource limits set (CPU, memory)
- [ ] Security scanning in CI
- [ ] Image signing

#### AWS Configuration

- [ ] IAM roles with least privilege
- [ ] MFA enforced for admin accounts
- [ ] CloudTrail logging enabled
- [ ] VPC configured with private subnets
- [ ] Security groups properly configured
- [ ] NACLs configured
- [ ] S3 buckets not public
- [ ] RDS in private subnet
- [ ] RDS encryption at rest
- [ ] RDS automated backups enabled
- [ ] Parameter groups hardened

#### Kubernetes (if applicable)

- [ ] Network policies defined
- [ ] Pod security policies
- [ ] RBAC configured
- [ ] Secrets encrypted at rest
- [ ] Resource quotas set
- [ ] Ingress controller secured

#### Monitoring & Alerting

- [ ] CloudWatch alarms configured
- [ ] Error rate alerts
- [ ] Latency alerts
- [ ] Disk usage alerts
- [ ] CPU/Memory alerts
- [ ] Security event alerts
- [ ] Failed login alerts
- [ ] Rate limit breach alerts

**Suggested alert names & thresholds (examples)**

- `svc_api_high_error_rate` — trigger when 5xx rate > 1% for 5m
- `svc_api_latency_p95` — trigger when p95 latency > 500ms for 5m
- `svc_api_cpu_high` — trigger when CPU > 85% for 10m
- `svc_auth_failed_logins` — trigger when failed logins > 100 within 10m

Include runbook links in alert annotations: `runbook: ./docs/09-observability-and-ops/operations.md#handling-high-error-rate`

---

### 📊 Logging & Observability

#### Logging

- [x] Structured logging implemented
- [x] Log levels configured
- [ ] Centralized log aggregation (CloudWatch/ELK)
- [ ] Log retention policy (90 days)
- [ ] PII redaction in logs
- [ ] Request ID correlation
- [x] Security event logging
- [ ] Audit trail for sensitive operations

#### Monitoring

- [ ] APM tool integrated (Datadog/New Relic)
- [ ] Error tracking (Sentry/Rollbar)
- [ ] Uptime monitoring
- [ ] Synthetic monitoring
- [ ] Real user monitoring (RUM)
- [ ] Custom business metrics

**Minimum observability requirements before go-live**

- Metrics exported to Prometheus with service and instance labels
- Traces exported via OTLP to collector; latency and error rate visible in dashboards
- Error events forwarded to Sentry (or equivalent) with enriched context
- Synthetic health checks covering login, claim creation, and list views

#### Tracing

- [x] Distributed tracing enabled
- [x] OpenTelemetry configured
- [x] Service dependencies mapped

> Note: OpenTelemetry exporters should be configured to the internal OTLP endpoint used by the organization's observability stack (see `monitoring/otel-collector-config.yml`). Traces for critical paths (auth, payments, policy changes) must include contextual attributes: service.name, deployment.environment, request.id.

---

### 🧪 Testing

#### Unit Tests

- [ ] > 80% code coverage
- [ ] All critical paths tested
- [ ] Edge cases covered
- [ ] Mocks/stubs for external dependencies

#### Integration Tests

- [ ] API endpoints tested
- [ ] Database operations tested
- [ ] External service integrations tested
- [ ] Error scenarios tested

#### End-to-End Tests

- [ ] Critical user journeys tested
- [ ] Cross-browser testing
- [ ] Mobile responsiveness tested
- [ ] Performance benchmarks met

#### Security Tests

- [x] Input validation tests
- [x] XSS prevention tests
- [x] SQL injection tests
- [x] CORS tests
- [x] Rate limiting tests
- [x] Security header tests
- [ ] Authentication tests
- [ ] Authorization tests

#### Load Tests

- [ ] Load testing completed
- [ ] Stress testing completed
- [ ] Scalability verified
- [ ] Resource usage under load measured

---

### 🚀 CI/CD

#### Build Pipeline

- [x] Automated builds
- [x] Linting in CI
- [x] Type checking
- [x] Unit tests in CI
- [x] Integration tests in CI
- [ ] E2E tests in CI
- [x] Security scans

#### Deployment Pipeline

- [x] Blue-green deployment capability
- [ ] Canary deployment capability
- [ ] Automated rollback
- [ ] Smoke tests after deployment
- [ ] Health check verification
- [x] SBOM generation
- [x] Image scanning before deployment
- [ ] Deployment approvals for production

#### Artifact Management

- [x] Docker images versioned
- [x] Semantic versioning
- [ ] Artifact signing
- [ ] Artifact retention policy

---

### 📚 Documentation

#### Technical Documentation

- [x] Architecture documentation
- [x] API documentation
- [ ] Database schema documentation
- [ ] Deployment documentation
- [ ] Runbooks for common operations
- [x] Incident response plan
- [ ] Disaster recovery plan
- [ ] Security documentation

#### User Documentation

- [ ] User guides
- [ ] API usage examples
- [ ] FAQ
- [ ] Troubleshooting guide

#### Operational Documentation

- [ ] Monitoring dashboard guide
- [ ] Alert response procedures
- [ ] Backup/restore procedures
- [ ] Scaling procedures
- [ ] On-call runbook

---

### 💾 Backup & Recovery

#### Backup Strategy

- [ ] Automated daily backups
- [ ] Backup retention policy (30 days)
- [ ] Offsite backup storage
- [ ] Backup encryption
- [ ] Backup monitoring
- [ ] Backup testing (monthly)

#### Disaster Recovery

- [ ] DR plan documented
- [ ] RTO defined (e.g., 4 hours)
- [ ] RPO defined (e.g., 1 hour)
- [ ] DR testing completed
- [ ] Failover procedures tested
- [ ] Communication plan for outages

---

### ⚡ Performance

#### Application Performance

- [ ] Response time <200ms (p95)
- [ ] Database query optimization
- [ ] N+1 query prevention
- [ ] Connection pooling configured
- [ ] Caching strategy implemented
- [ ] CDN configured for static assets
- [ ] Asset minification/compression
- [ ] Image optimization

#### Scalability

- [ ] Horizontal scaling tested
- [ ] Auto-scaling configured
- [ ] Load balancing configured
- [ ] Database read replicas (if needed)
- [ ] Stateless application design
- [ ] Session management externalized

---

### 🔄 Operational Readiness

#### Deployment

- [ ] Deployment checklist created
- [ ] Rollback procedure documented
- [ ] Database migration strategy
- [ ] Zero-downtime deployment verified
- [ ] Feature flags configured

#### Monitoring & On-Call

- [ ] On-call rotation defined
- [ ] Escalation procedures documented
- [ ] PagerDuty/alerting configured
- [ ] Status page setup
- [ ] Incident response team trained

**On-call acceptance criteria**

- On-call schedule published and reachable by team members
- PagerDuty escalation policy configured with at least two escalation steps
- Runbook for highest-severity alerts present and verified by tabletop exercise

#### Cost Management

- [ ] Resource tagging strategy
- [ ] Cost monitoring configured
- [ ] Budget alerts set
- [ ] Reserved instances (if applicable)
- [ ] Spot instances for non-critical workloads

---

### 📱 Application Features

#### Core Functionality

- [ ] All features tested in staging
- [ ] User acceptance testing completed
- [ ] Performance requirements met
- [ ] Accessibility requirements met (WCAG 2.1)
- [ ] Browser compatibility verified
- [ ] Mobile compatibility verified

#### User Experience

- [ ] Error messages user-friendly
- [ ] Loading states implemented
- [ ] Graceful degradation
- [ ] Offline support (if applicable)

---

### 🌐 DNS & Networking

#### Domain Configuration

- [ ] Production domain registered
- [ ] SSL certificates installed
- [ ] Certificate auto-renewal configured
- [ ] DNS records configured
- [ ] DNSSEC enabled
- [ ] CAA records configured

#### CDN

- [ ] CDN configured (CloudFront)
- [ ] Cache headers optimized
- [ ] Gzip/Brotli compression enabled
- [ ] HTTP/2 enabled

---

### 📧 External Services

#### Email

- [ ] Transactional email service configured
- [ ] SPF/DKIM/DMARC configured
- [ ] Email templates tested
- [ ] Bounce/complaint handling

#### Payment Processing (if applicable)

- [ ] PCI DSS compliance verified
- [ ] Payment gateway integrated
- [ ] Test transactions completed
- [ ] Refund process tested
- [ ] Webhook handling implemented

#### Third-party Integrations

- [ ] API rate limits understood
- [ ] Error handling for external failures
- [ ] Circuit breakers implemented
- [ ] Retry logic with exponential backoff

---

### ✅ Final Checks

#### Pre-Launch

- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] All critical bugs resolved
- [ ] Stakeholder sign-off
- [ ] Legal review completed
- [ ] Marketing materials ready
- [ ] Support team trained
- [ ] Launch communication plan

#### Launch Day

- [ ] All team members available
- [ ] Monitoring dashboards open
- [ ] Incident response team on standby
- [ ] Rollback plan ready
- [ ] Communication channels ready
- [ ] Status page updated

#### Post-Launch (First 48 Hours)

- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Monitor user feedback
- [ ] Check backup completion
- [ ] Review security logs
- [ ] Post-launch retrospective scheduled

---

## How to verify this checklist

1. Assign owners for SRE/Security/Product in the Owners section above.
2. Run automated verification: `npm run validate:env && npm run test:ci -- --smoke`.
3. Execute the backup-and-restore validation job: `scripts/backup/validate-restore.sh`.
4. Conduct a tabletop incident exercise with on-call and security for at least one high-severity scenario.
5. Add any last-minute deviations to the release ticket and obtain stakeholder sign-off.

---

## Scoring

**Security:** **\_/40 (Critical items must be 100%)  
**Infrastructure:** \_**/25  
**Logging & Observability:** **\_/15  
**Testing:** \_**/20  
**CI/CD:** **\_/15  
**Documentation:** \_**/10  
**Backup & Recovery:** **\_/15  
**Performance:** \_**/10  
**Operational Readiness:** **\_/15  
**Application Features:** \_**/10  
**DNS & Networking:** **\_/10  
**External Services:** \_**/10  
**Final Checks:** \_\_\_/15

**Total:** \_\_\_/200

**Production Ready If:**

- Security score: 100%
- Total score: >85% (170/200)
- All critical items complete

---

## Sign-Off

**Engineering Lead:** **\*\*\*\***\_**\*\*\*\*** Date: **\_\_\_**  
**Security Lead:** **\*\*\*\***\_**\*\*\*\*** Date: **\_\_\_**  
**CTO:** **\*\*\*\***\_**\*\*\*\*** Date: **\_\_\_**  
**CEO (if required):** **\*\*\*\***\_**\*\*\*\*** Date: **\_\_\_**

---

**Current Status:** Phase 1 Complete - Critical Security Implemented  
**Next Review:** Before production deployment  
**Approved for Production:** ⬜ Yes ⬜ No
