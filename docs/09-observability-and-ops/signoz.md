# SigNoz Local Observability Stack

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

The SigNoz stack provides a ClickHouse-backed observability plane for tracing, metrics, and alerting while developing Political Sphere services.

## Why SigNoz?

- Open source and self-hostable (no vendor lock-in)
- Drop-in OpenTelemetry collector endpoints (`4317`, `4318`)
- Web UI for spans, metrics, alerts, and dashboards
- Works offline inside the devcontainer or on bare metal

## Quick Start

```bash
# Boot the stack in detached mode
scripts/observability/signoz.sh up

# View logs or troubleshoot
scripts/observability/signoz.sh logs

# Tear down when finished
scripts/observability/signoz.sh down
```

SigNoz UI: [http://localhost:3301](http://localhost:3301)

## Wiring Applications

1. Point OTLP exporters to `http://localhost:4317` (gRPC) or `http://localhost:4318` (HTTP).
2. Ensure `NODE_ENV` is set to `development` so instrumentation stays lightweight.
3. Use `SIGNOZ_QUERY_SERVICE=http://localhost:8081` for programmatic queries in tests or scripts.

## Devcontainer Tips

- The devcontainer exposes Docker-in-Docker, so the helper script works both locally and inside VS Code Remote Containers.
- Keep SigNoz off during CI runs to conserve resources—this stack is for local validation only.
- ClickHouse volumes live outside the repo (`docker volume ls | grep clickhouse`), so you can wipe telemetry data with `docker volume rm`.
