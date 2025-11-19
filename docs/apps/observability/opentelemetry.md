# Observability: Azure Monitor & OpenTelemetry

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

This note summarises how to get started with OpenTelemetry on Azure (Application Insights / Azure Monitor) for the project's services. It emphasises a low-risk rollout (staging → canary → prod) and cost-aware sampling.

## Key points

- Use the Azure Monitor OpenTelemetry Distro to collect traces, metrics, and logs for .NET, Node.js, Python and Java applications.
- Automatic instrumentation is available for many runtimes; language-specific guidance covers minimal code changes (for .NET) or JVM agent configuration (for Java).
- Consider sampling, ingestion costs and Live Metrics when enabling telemetry in production.

## Authoritative Microsoft Learn links

- Azure Monitor OpenTelemetry overview: https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry
- Enable OpenTelemetry (language-specific): https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable
- OpenTelemetry data collection and telemetry types: https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-overview#telemetry-types

## Practical rollout steps

1. Instrument one service in staging first. Configure an Application Insights resource or workspace and set the connection string in environment variables (`APPLICATIONINSIGHTS_CONNECTION_STRING`).
2. Use the Azure Monitor OpenTelemetry Distro for your runtime and enable automatic instrumentation. Validate spans appear in the portal.
3. Configure sampling and ingestion limits to control cost. Validate Live Metrics in staging and tune sampling for p95/p99 visibility.
4. Extend tracing to cross-service calls (HTTP, messaging) and ensure consistent semantic attributes (e.g., `service.name`, `http.method`, `http.status_code`, `net.peer.name`).

## Small .NET example (from Microsoft guidance)

In ASP.NET Core, add the Azure Monitor OpenTelemetry integration in `Program.cs`:

```csharp
// Import the Azure.Monitor.OpenTelemetry.AspNetCore namespace
using Azure.Monitor.OpenTelemetry.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenTelemetry().UseAzureMonitor();
var app = builder.Build();
app.Run();
```

## Notes for Node/Java/Python

- Java: prefer the Azure OpenTelemetry JVM agent (no code changes) by adding `-javaagent:path/to/agent.jar` to JVM args (see docs).
- Node.js/Python: use the Azure Monitor OpenTelemetry distro packages or auto-instrumentation; set connection string via env var and enable specific instrumentations you need.

## Next steps

- Add an `observability/onboarding.md` with exact enablement steps for our runtimes and a checklist for staging validation (span presence, sampling, dashboards).
- Wire trace/metric ingestion alerts for high error rates, high latency and sudden ingestion spikes.

\*\*\* Last updated: 2025-11-04

# Observability: Azure Monitor & OpenTelemetry

This note summarises how to get started with OpenTelemetry on Azure (Application Insights / Azure Monitor) for the project's services. It emphasises a low-risk rollout (staging → canary → prod) and cost-aware sampling.

## Key points

- Use the Azure Monitor OpenTelemetry Distro to collect traces, metrics, and logs for .NET, Node.js, Python and Java applications.
- Automatic instrumentation is available for many runtimes; language-specific guidance covers minimal code changes (for .NET) or JVM agent configuration (for Java).
- Consider sampling, ingestion costs and Live Metrics when enabling telemetry in production.

## Authoritative Microsoft Learn links

- Azure Monitor OpenTelemetry overview: https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry
- Enable OpenTelemetry (language-specific): https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable
- OpenTelemetry data collection and telemetry types: https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-overview#telemetry-types

## Practical rollout steps

1. Instrument one service in staging first. Configure an Application Insights resource or workspace and set the connection string in environment variables (`APPLICATIONINSIGHTS_CONNECTION_STRING`).
2. Use the Azure Monitor OpenTelemetry Distro for your runtime and enable automatic instrumentation. Validate spans appear in the portal.
3. Configure sampling and ingestion limits to control cost. Validate Live Metrics in staging and tune sampling for p95/p99 visibility.
4. Extend tracing to cross-service calls (HTTP, messaging) and ensure consistent semantic attributes (e.g., `service.name`, `http.method`, `http.status_code`, `net.peer.name`).

## Small .NET example (from Microsoft guidance)

In ASP.NET Core, add the Azure Monitor OpenTelemetry integration in `Program.cs`:

```csharp
// Import the Azure.Monitor.OpenTelemetry.AspNetCore namespace
using Azure.Monitor.OpenTelemetry.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenTelemetry().UseAzureMonitor();
var app = builder.Build();
app.Run();
```

## Notes for Node/Java/Python

- Java: prefer the Azure OpenTelemetry JVM agent (no code changes) by adding `-javaagent:path/to/agent.jar` to JVM args (see docs).
- Node.js/Python: use the Azure Monitor OpenTelemetry distro packages or auto-instrumentation; set connection string via env var and enable specific instrumentations you need.

## Next steps

- Add an `observability/onboarding.md` with exact enablement steps for our runtimes and a checklist for staging validation (span presence, sampling, dashboards).
- Wire trace/metric ingestion alerts for high error rates, high latency and sudden ingestion spikes.

```markdown
# Observability: Azure Monitor & OpenTelemetry

This note summarises how to get started with OpenTelemetry on Azure (Application Insights / Azure Monitor) for the project's services.

Key points

- Use the Azure Monitor OpenTelemetry Distro to collect traces, metrics, and logs for .NET, Node.js, Python and Java applications.
- Automatic instrumentation is available for many runtimes; language-specific guidance covers minimal code changes (for .NET/Node) or JVM agent configuration (for Java).
- Consider sampling, ingestion costs and Live Metrics when enabling telemetry in production.

Authoritative Microsoft Learn links

- Azure Monitor OpenTelemetry overview: https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry
- Enable OpenTelemetry for supported languages: https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable
- OpenTelemetry data collection and telemetry types: https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-overview#telemetry-types

Practical steps

1. Instrument one service first (staging). Configure Application Insights workspace and set the connection string in environment variables.
2. Use the Azure Monitor OpenTelemetry Distro package for your runtime and enable automatic instrumentation.
3. Configure sampling to control volume and costs; validate Live Metrics and traces in the portal.
4. Extend tracing to cross-service calls (HTTP, messaging) and ensure consistent semantic attributes for easier querying.
```
