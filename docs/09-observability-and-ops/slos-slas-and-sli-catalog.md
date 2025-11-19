# SLOs, SLAs and SLI Catalog

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

This document catalogs the primary Service Level Objectives (SLOs), Service Level Indicators (SLIs), and measurement guidance used to evaluate production readiness.

## Key SLOs

- API Availability (p99): 99.9%
  - SLI: fraction of successful healthcheck responses over 30d window
  - Measurement: synthetic health checks + service uptime metric

- API Latency (p95): &lt; 200ms
  - SLI: p95 of request latency for `api` service measured over 5m windows
  - Measurement: histogram of request durations exported to Prometheus; dashboarded in `prod-overview`

- Error Rate (5xx): &lt; 1% (rolling 5m)
  - SLI: rate of 5xx responses divided by total requests over 5m
  - Measurement: Prometheus ratio metric `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])`

## Alerting Thresholds (Guidance)

- Warning: error rate > 0.5% for 10m
- Critical/rollback: error rate > 1% for 5m
- Latency warning: p95 &gt; 200ms for 10m
- Latency critical: p95 &gt; 500ms for 5m

## Measurement & Sources

- Metrics: Prometheus (instrumentation using OpenTelemetry)
- Traces: OTLP exporter to collector (Jaeger/Grafana Tempo)
- Logs: Centralized log store (CloudWatch/ELK) with request id correlation

## Ownership & SLAs

- Measurement owner: SRE Team
- SLA recipients: Product, Security, Legal (per contract)

## Notes

Update this catalog when adding new services or changing SLO targets. Link to this file from runbooks and the production readiness checklist.
