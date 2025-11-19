# Cost Architecture and FinOps

> **Zero-budget guardrails for Political Sphere’s infrastructure and operations**

<div align="center">

| Classification | Version | Last Updated |      Owner       | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :--------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-10-30  | Platform Council |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## 🎯 Objectives

- Maintain zero-budget constraint: no cloud spend, no paid services, no premium tooling.
- Instrument cost visibility early to prevent runaway expenses.
- Align infrastructure decisions with ethical, sustainable growth.

---

## 🧱 Cost Principles

- **Free-First:** Prioritise open-source, self-hosted, or free-tier options (Docker, PostgreSQL, Redis, Ollama).
- **Local Development:** All dev work on local machines; no cloud dev environments.
- **Deployment:** Self-host on free-tier VMs (e.g., Oracle Cloud free tier, AWS Lightsail free year) or home lab.
- **Scaling:** Horizontal scaling via commodity hardware; avoid vendor lock-in.
- **Monitoring:** Open-source telemetry (Prometheus, Grafana) self-hosted.

---

## 📊 Cost Tracking

| Component                           | Estimated Cost (Annual) | Notes                                                    |
| ----------------------------------- | ----------------------- | -------------------------------------------------------- |
| **Compute (VM)**                    | $0–$100                 | Free tiers or low-cost VPS; scale via multiple instances |
| **Database (PostgreSQL)**           | $0                      | Self-hosted on VM or free managed tier (Supabase free)   |
| **Cache/Queues (Redis)**            | $0                      | Self-hosted on VM                                        |
| **Storage (S3-compatible)**         | $0                      | MinIO self-hosted or free object storage                 |
| **AI (Ollama)**                     | $0                      | Local models; no API costs                               |
| **Monitoring (Prometheus/Grafana)** | $0                      | Self-hosted on VM                                        |
| **Domain/SSL**                      | $10–$20                 | Cheap registrar; free Let's Encrypt                      |

**Total Annual Budget:** <$200 (excluding electricity/hardware)

---

## 🛠️ FinOps Practices

- **IaC Annotations:** Terraform configs include cost estimates and tags for resource tracking.
- **Usage Monitoring:** Dashboards track VM utilisation, storage growth, bandwidth.
- **Optimization Reviews:** Quarterly audits to right-size resources and eliminate waste.
- **Budget Alerts:** Thresholds on VM costs; manual reviews for any paid services.

---

## 📎 Related Docs

- [Scalability & Performance](./scalability-and-performance.md)
- [Reliability & Resilience](./reliability-and-resilience.md)
- [Observability Architecture](./observability-architecture.md)

FinOps ensures Political Sphere remains accessible and sustainable—measure, optimise, and stay free.
