# Incident Response Playbooks

**Version:** 1.0.0  
**Last Updated:** 2025-11-14  
**Owner:** Operations Team

## Overview

This directory contains runbooks and playbooks for responding to operational incidents in the Political Sphere platform. Each playbook provides step-by-step guidance for diagnosing and resolving specific incident types.

## Quick Access

| Incident Type | Playbook | Severity | Response Time |
|---------------|----------|----------|---------------|
| Database Failure | [database-failure.md](database-failure.md) | Critical | < 15 minutes |
| API Outage | [api-outage.md](api-outage.md) | Critical | < 15 minutes |
| Security Breach | [security-breach.md](security-breach.md) | Critical | Immediate |
| Data Corruption | [data-corruption.md](data-corruption.md) | High | < 30 minutes |
| Performance Degradation | [performance-degradation.md](performance-degradation.md) | Medium | < 1 hour |
| Authentication Issues | [authentication-issues.md](authentication-issues.md) | High | < 30 minutes |
| Frontend Errors | [frontend-errors.md](frontend-errors.md) | Medium | < 1 hour |
| Deployment Rollback | [deployment-rollback.md](deployment-rollback.md) | High | < 15 minutes |

## Incident Severity Levels

### Critical (P0)
- **Impact**: Complete service outage affecting all users
- **Examples**: Database down, API completely unresponsive, security breach
- **Response**: Immediate escalation, 24/7 on-call response
- **Communication**: Status page update, user notification

### High (P1)
- **Impact**: Major functionality broken affecting significant user subset
- **Examples**: Authentication failing, voting system down, data corruption
- **Response**: < 30 minutes during business hours, escalate after hours
- **Communication**: Status page update

### Medium (P2)
- **Impact**: Partial degradation affecting some users
- **Examples**: Performance issues, non-critical features broken
- **Response**: < 1 hour during business hours
- **Communication**: Internal notification only

### Low (P3)
- **Impact**: Minor issues with workarounds available
- **Examples**: UI bugs, documentation errors, minor performance issues
- **Response**: Next business day
- **Communication**: Track in issue tracker

## Incident Response Process

### 1. Detection
- Automated monitoring alerts (Datadog, Sentry, OpenTelemetry)
- User reports via support channels
- Manual discovery during operations

### 2. Assessment
- Determine severity level (P0-P3)
- Identify affected services and user impact
- Gather initial diagnostic data

### 3. Response
- Follow relevant playbook
- Assemble incident response team if needed
- Establish communication channels (Slack #incidents)

### 4. Resolution
- Apply fix or workaround
- Verify service restoration
- Monitor for recurrence

### 5. Post-Incident
- Write post-mortem (blameless)
- Identify root cause
- Create action items to prevent recurrence
- Update playbooks with learnings

## On-Call Rotation

### Primary On-Call
- **Responsibility**: First responder for all incidents
- **Response Time**: < 15 minutes for P0/P1, < 1 hour for P2
- **Escalation**: If unresolved in 30 minutes (P0/P1)

### Secondary On-Call
- **Responsibility**: Backup and escalation point
- **Response Time**: < 30 minutes when escalated
- **Escalation**: Engineering manager if unresolved in 1 hour

### Escalation Chain
1. Primary On-Call Engineer
2. Secondary On-Call Engineer
3. Engineering Manager
4. CTO (for critical security incidents)

## Communication Channels

### Internal
- **Slack**: #incidents (incident coordination)
- **PagerDuty**: Critical alerts and escalation
- **Zoom**: Incident bridge for real-time collaboration

### External
- **Status Page**: https://status.political-sphere.com
- **Twitter/Social**: @political_sphere
- **Email**: status@political-sphere.com

## Tools and Access

### Required Access
- **Production AWS**: Via AWS SSO (read-only by default)
- **Kubernetes**: kubectl with production context
- **Datadog**: Full dashboard and logs access
- **Sentry**: Error monitoring and release tracking
- **Database**: Read-only replica access (write requires approval)

### Essential Commands
```bash
# Check service health
kubectl get pods -n production

# View recent logs
kubectl logs -f deployment/api -n production --tail=100

# Check database status
psql -h production-db.internal -U readonly -c "SELECT version();"

# View metrics
open https://app.datadoghq.com/dashboard/political-sphere

# Emergency deployment rollback
kubectl rollout undo deployment/api -n production
```

## Post-Incident Review Template

**Incident ID**: INC-YYYY-MM-DD-NNN  
**Severity**: P0/P1/P2/P3  
**Date**: YYYY-MM-DD  
**Duration**: HH:MM  
**Responders**: [Names]

### Summary
[Brief description of what happened]

### Impact
- **Users Affected**: [Number or percentage]
- **Services Impacted**: [List]
- **Revenue Impact**: [If applicable]

### Timeline
- **HH:MM** - Incident detected
- **HH:MM** - Response began
- **HH:MM** - Root cause identified
- **HH:MM** - Fix deployed
- **HH:MM** - Service restored

### Root Cause
[Technical explanation of what caused the incident]

### Resolution
[What was done to fix the issue]

### Action Items
1. [ ] [Preventive measure 1] - Owner: [Name] - Due: [Date]
2. [ ] [Preventive measure 2] - Owner: [Name] - Due: [Date]
3. [ ] [Documentation update] - Owner: [Name] - Due: [Date]

### Lessons Learned
- **What went well**: [Positive aspects of response]
- **What could improve**: [Areas for improvement]
- **Questions**: [Unresolved questions or concerns]

## Playbook Maintenance

### Review Cycle
- **Quarterly**: Review all playbooks for accuracy
- **Post-Incident**: Update playbook if gaps identified
- **After Major Changes**: Update when infrastructure or architecture changes

### Ownership
Each playbook has a designated owner responsible for:
- Keeping information current
- Testing procedures periodically
- Incorporating feedback from incident reviews

### Testing
- **Quarterly Drills**: Simulate incidents to test playbooks
- **Chaos Engineering**: Use controlled failures to validate procedures
- **Tabletop Exercises**: Walk through scenarios with team

## Related Documentation

- [Error Monitoring Integration](../error-monitoring-integration.md)
- [Performance Monitoring](../performance-monitoring.md)
- [Security Policy](../../06-security-and-risk/security.md)
- [Disaster Recovery Plan](../disaster-recovery.md)
- [Operations Runbook](../operations-runbook.md)

## Contact Information

- **Operations Team Lead**: ops-lead@political-sphere.com
- **Security Team**: security@political-sphere.com
- **Engineering Manager**: eng-manager@political-sphere.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX (24/7)
