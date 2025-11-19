# On-Call and Incident Handbook

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Purpose

This handbook documents on-call responsibilities, escalation policies, and the incident response playbooks used by the Political Sphere SRE and Security teams.

## Contact & Roster

- PagerDuty: https://pagerduty.example.com/teams/political-sphere
- On-call schedule: https://calendar.example.com/oncall
- Primary contacts: oncall@sre.political-sphere.example

## Escalation Playbook (Example)

1. Alert fires (Prometheus / Grafana)
2. PagerDuty notifies primary on-call (SMS, push, email)
3. Primary acknowledges within 5 minutes and triages
   - If issue is P1 and not mitigated in 10 minutes, escalate to secondary on-call
   - If P1 persists > 30 minutes, escalate to SRE Lead and Security Lead
4. When mitigation occurs, update incident in PagerDuty and create Postmortem ticket

## PagerDuty Run Steps

- Acknowledge the alert and gather context from Grafana dashboard
- Check recent deploys in GitHub Actions
- Check application logs for exceptions (CloudWatch)
- Correlate traces in Jaeger/Tempo for request path
- Temporarily mute noisy alerts (only if necessary) and annotate the incident

## Tabletop Exercise (Quarterly)

Purpose: Validate runbooks, on-call readiness, and communication channels.

Steps:

1. Schedule a 60-minute exercise with on-call, SRE lead, product owner, and security.
2. Run a simulated P1 scenario (e.g., high error rate due to database failover).
3. Walk through detection, escalation, rollback decision, and recovery.
4. Capture action items and update runbooks within 48 hours.

## Postmortem Template

- Incident title
- Severity
- Timeline
- Root cause
- Mitigation and rollback steps
- Action items and owners
- Postmortem reviewer and sign-off

## Communication Templates

**Incident Start (short)**

Title: [P1] Service outage impacting login
Body: We are investigating a service outage affecting login. On-call team is triaging. ETA: 30 minutes. Updates every 15 minutes.

**Incident Resolved**

Title: [Resolved] Service outage impacting login
Body: The service has recovered. Root cause: ... Next steps: ... Postmortem ticket: #123

## Ownership

- Incident commander: on-call engineer
- Postmortem owner: SRE lead
- Communications owner: Product Ops

## Runbook Links

- Deployment Runbook: `./deployment-runbook.md`
- Dashboards & Alerts: `./dashboards-and-alerts.md`
- SLO/SLI Catalog: `./slos-slas-and-sli-catalog.md`
