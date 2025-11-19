# Scalability & Performance

> **Non-functional playbook for keeping Political Sphere fast and responsive**

<div align="center">

| Classification | Version | Last Updated |      Owner       | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :--------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-10-30  | Platform Council |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## 🎯 Targets

| Metric               | Target                       | Notes                                         |
| -------------------- | ---------------------------- | --------------------------------------------- |
| **API Latency**      | P95 < 250 ms                 | Applies to GraphQL and REST; measured at edge |
| **Realtime Latency** | Server-side < 150 ms         | Debate/vote events from publish → client      |
| **Availability**     | 99.9% MVP, roadmap to 99.95% | Error budgets defined per SLO                 |
| **Throughput**       | 5k concurrent users baseline | Scale beyond via horizontal nodes             |

---

## 🧱 Architectural Tactics

- **Modular Monolith:** Nx boundaries prevent hotspot coupling; scale-critical contexts (Debate, AI, Safety) isolated in code for easy extraction.
- **Caching Strategy:** Redis-backed query caching for read-heavy GraphQL queries; TTL tuned per domain (e.g., constituencies vs. live debates).
- **Async Workloads:** Long-running operations (AI generation, media synthesis, report triage) executed via worker queues; clients receive `202` with status polling/subscription.
- **Backpressure & Throttling:** Realtime gateway implements ack-based flow control; REST/GraphQL write ops throttled per user + tenant; AI endpoints protected with circuit breakers.
- **CQRS Read Models:** Debate transcripts and vote tallies maintain denormalised views for low-latency access; updated via NATS events.
- **Static Asset Optimisation:** Vite build outputs served through CDN with cache busting; design system ensures bundle discipline (<250 KB critical path).

---

## 🛠️ Performance Testing

| Test Type              | Tooling                  | Cadence                   | Success Criteria                                              |
| ---------------------- | ------------------------ | ------------------------- | ------------------------------------------------------------- |
| **Load Tests**         | Locust/k6                | Pre-release and quarterly | Sustain 5k concurrent sessions with <10% error rate           |
| **Soak Tests**         | k6 (duration >6 hrs)     | Quarterly                 | Detect memory leaks, queue growth, GC issues                  |
| **Realtime Burst**     | Custom websocket harness | Before feature launch     | Support 1k simultaneous debate events without >150 ms latency |
| **Client Performance** | Lighthouse, Web Vitals   | CI + regression           | LCP <2.5 s, TBT <200 ms on reference hardware                 |

---

## 🔍 Monitoring & Alerts

- Dashboards track latency percentiles, queue depth, CPU/memory utilisation, GC pauses.
- Alert thresholds tied to error budgets (e.g., >30% budget burn in 24 hrs triggers incident).
- Synthetic monitoring for core flows (login, join debate, cast vote) running every 5 min.
- Realtime gateway monitors connection churn, reconnect rate, and message lag.

---

## 📎 Optimization Playbook

1. **Measure:** Use OpenTelemetry traces & profiling to identify hotspots.
2. **Stabilise:** Add caching, adjust queries, or introduce rate limits before code changes.
3. **Optimise:** Refactor to async, offload to worker, or reshape data access.
4. **Scale Out:** Increase replicas, enable autoscaling, or move to dedicated service (with ADR).
5. **Verify:** Re-run load suite; add regression tests to prevent relapse.

Stay disciplined—optimise where metrics justify it, and document changes via ADRs to maintain shared understanding.
