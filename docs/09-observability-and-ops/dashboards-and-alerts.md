# Dashboards and Alerts

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Purpose

This document lists recommended dashboards and alerting rules for the Political Sphere platform. It is intended to be concise and point-runbooks and SLO definitions.

## Recommended Dashboards

- Production Overview (`/d/prod-overview`) — error rates, latency, throughput, healthy hosts, and high-level business KPIs.
- Canary Deployment (`/d/canary-deployment`) — canary health, error budget consumption, and per-stage metrics.
- Error Budget (`/d/error-budget`) — SLO burn rates and projection charts.
- Service Detail (`/d/service-{name}`) — per-service CPU, memory, GC, request latency histogram, and top error traces.

## Example Alert Rules (Prometheus/Grafana)

- svc_api_high_error_rate
  - Expression: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
  - For: 5m
  - Severity: P1
  - Runbook: `./runbooks-index.md#handling-high-error-rate`

- svc_api_latency_p95
  - Expression: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.5
  - For: 5m
  - Severity: P1
  - Runbook: `./runbooks-index.md#handling-high-latency`

## Alert Annotations

Each alert should include the following annotations:

- summary — short human-readable summary
- runbook — relative link to runbook section
- dashboard — link to the relevant Grafana dashboard
- playbook — immediate steps to triage

## Ownership

Dashboards and alert rules are owned by the SRE Team. Changes to alerts must go through the `observability` repo or the infra CI with review.
