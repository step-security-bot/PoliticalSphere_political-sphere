# Context Diagrams (C4)

> **System context and container views for Political Sphere’s modular monolith**

<div align="center">

| Classification | Version | Last Updated |      Owner       | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :--------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-10-30  | Platform Council |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## 🧾 C4 Level 1 – System Context

```mermaid
graph TB
    Player[Player] -->|GraphQL / WebSockets| PoliticalSphere
    Moderator[Game Master / Moderator] -->|Admin Console| PoliticalSphere
    Educator[Educator / Facilitator] -->|Scenario Tools| PoliticalSphere
    Admin[Admin / DevOps] -->|Ops & Auditing| PoliticalSphere
    ExternalAI[LLM Providers] <-->|MCP Orchestration| PoliticalSphere
    GovAPI[Open Data / Parliament APIs] -->|Data Sync| PoliticalSphere
    Analytics[Observability Stack] <-->|Telemetry| PoliticalSphere
    Compliance[Compliance Reviewers] -->|Audit Exports| PoliticalSphere

    PoliticalSphere[Political Sphere Platform\n(Node.js Nx Monolith)\n• Gameplay Simulation\n• AI Assistance\n• Governance by Design]
```

**Key Responsibilities**

- Deliver immersive UK parliamentary simulation with AI-assisted NPCs.
- Maintain compliance with GDPR, Online Safety Act, and ISO-aligned governance.
- Provide tooling for moderators, educators, and administrators.

---

## 🧱 C4 Level 2 – Container Diagram

```mermaid
graph LR
    subgraph Client Applications
        WebClient[Player Web Client\nReact + Vite]
        AdminConsole[Moderator/Admin Console\nReact + Vite]
    end

    subgraph API Edge
        Gateway[GraphQL Gateway\nFastify + Mercurius]
        RestAPI[Admin / Ops REST API]
        RealtimeGW[Realtime Gateway\nSocket.IO]
    end

    subgraph Services
        DomainServices[Domain Services\nParliamentary, Elections, Media, Safety]
        WorkerFleet[Async Workers\nBullMQ / Temporal (future)]
        AIServices[AI Orchestrator\nMCP Hub, Guardrails]
    end

    subgraph Data Stores
        Postgres[(PostgreSQL)]
        Redis[(Redis Cache/Queues)]
        ObjectStore[(S3-Compatible Storage)]
        AuditStore[(Secure Audit Log)]
        NATS[(NATS Event Bus)]
    end

    WebClient --> Gateway
    AdminConsole --> Gateway
    AdminConsole --> RestAPI
    WebClient --> RealtimeGW
    Gateway --> DomainServices
    RestAPI --> DomainServices
    RealtimeGW --> DomainServices
    DomainServices --> Postgres
    DomainServices --> Redis
    DomainServices --> NATS
    WorkerFleet --> Postgres
    WorkerFleet --> Redis
    WorkerFleet --> ObjectStore
    WorkerFleet --> AuditStore
    WorkerFleet --> NATS
    AIServices --> DomainServices
    AIServices --> Redis
    AIServices --> AuditStore
    Gateway --> AuditStore
```

---

## 🎯 Domain Collaboration Highlights

- **Gameplay Loop:** Players interact via GraphQL and realtime channels → Parliamentary Core manages motions/divisions → Debate & Chambers broadcast updates → Media & Narrative generates summaries.
- **AI Assistance:** AI Simulation orchestrator consumes events from NATS, calls provider-specific adapters, applies safety filters, and returns responses through GraphQL mutations/subscriptions.
- **Moderation:** Safety & Moderation context exposes restricted REST endpoints for case handling; escalations trigger audit events and transparency reports.
- **Compliance:** Audit store receives append-only events from every mutation; Admin/Compliance tooling exports reports via dedicated REST endpoints.

---

## 📎 Next Layers

- Level 3 component diagrams live alongside each context (see domain-specific docs).
- Sequence diagrams for debate/vote flow and AI moderation pipeline reside in `docs/07-ai-and-simulation/` and `docs/08-game-design-and-mechanics/`.

Keep these diagrams updated alongside ADRs and major architectural changes to preserve shared understanding.
