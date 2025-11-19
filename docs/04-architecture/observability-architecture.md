# Observability Architecture

> **Instrumentation strategy for visibility across Political Sphere’s platform and AI systems**

<div align="center">

| Classification | Version | Last Updated |      Owner       | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :--------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-10-30  | Platform Council |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## 🎯 Objectives

- Provide end-to-end tracing from player request to AI decision to audit log.
- Deliver actionable metrics and alerts aligned with SLOs and error budgets.
- Ensure compliance-ready logging with privacy safeguards.

---

## 🧱 Telemetry Stack

| Pillar      | Tooling                                                                      | Notes                                                                     |
| ----------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Tracing** | OpenTelemetry SDK (Node.js, React via W3C Trace Context), Tempo/Jaeger (TBD) | Every request carries `traceId`; spans include tenant, feature flag state |
| **Metrics** | Prometheus-compatible exporters, Grafana dashboards                          | Standard metrics library, RED/USE dashboards per service                  |
| **Logging** | Pino structured logs → Loki/Elastic                                          | JSON logs with redaction middleware; correlation IDs mandatory            |
| **APM**     | OpenTelemetry collectors feeding into vendor-neutral backend                 | Evaluate Lightstep/New Relic after MVP if needed                          |

---

## 🔍 Instrumentation Standards

- **Service Metadata:** Include `service.name`, `service.version`, `deployment.environment` on every span/metric/log.
- **Correlation:** Propagate `traceId` through GraphQL resolvers, REST handlers, worker jobs, and NATS events; realtime gateway annotates messages with `traceId`.
- **PII Hygiene:** Redaction middleware strips emails, IPs, UGC; safe hashes stored when correlation needed; comply with GDPR logging guidance.
- **AI Transparency:** AI orchestration emits spans for prompt generation, provider calls, safety filters, human handoff; logs stored in Safety Transparency Log.
- **Frontend Insight:** React app integrates Web Vitals, error boundaries, and trace context to tie UX issues back to backend spans.

---

## 📊 Dashboards

| Dashboard               | KPIs                                                                       | Consumers            |
| ----------------------- | -------------------------------------------------------------------------- | -------------------- |
| **Platform SLO**        | API latency/error rate, realtime lag, queue depth                          | Platform, Product    |
| **Gameplay Health**     | Debate join success, vote latency, AI assist usage, NPC errors             | Product, Game Design |
| **Safety & Moderation** | Report volume, SLA adherence, moderator backlog, false positives/negatives | Safety, Compliance   |
| **AI Quality**          | Prompt throughput, provider latency, refusal rate, evaluation scores       | AI Ops, Ethics       |
| **Infrastructure**      | CPU/memory/disk, cost metrics, node health                                 | DevOps               |

---

## 🔔 Alerting

- Alerts defined per SLO with playbooks referenced in [On-Call Handbook](../09-observability-and-ops/on-call-and-incident-handbook.md).
- Multi-channel notifications (PagerDuty/Slack/Email) with severity tiers.
- AI-specific alerts (model failure, safety bypass, evaluation regression) escalate to AI Ops + Ethics Committee.

---

## 🧪 Observability QA

- Include instrumentation tests in CI to ensure critical spans/metrics/logs emitted.
- Run synthetic monitors for key journeys (login, debate, vote, moderation) to collect baseline telemetry.
- Observability reviews during readiness checks, ADRs, and postmortems to capture gaps.

---

## 📎 Related Docs

- [Scalability & Performance](./scalability-and-performance.md)
- [Reliability & Resilience](./reliability-and-resilience.md)
- [AI Telemetry](../07-ai-and-simulation/telemetry-for-ai-systems.md)
- [Ops Dashboards & Alerts](../09-observability-and-ops/dashboards-and-alerts.md)

Observability is the feedback loop that keeps Political Sphere accountable—instrument early, review often, and evolve dashboards with stakeholder needs.
