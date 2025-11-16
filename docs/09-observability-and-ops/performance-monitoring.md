# Performance Monitoring with OpenTelemetry

**Version:** 1.0.0  
**Last Updated:** 2025-11-14  
**Status:** Recommended

## Overview

This guide documents OpenTelemetry (OTel) integration for comprehensive performance monitoring, distributed tracing, and metrics collection across Political Sphere applications.

## What is OpenTelemetry?

OpenTelemetry is a vendor-neutral observability framework that provides:
- **Distributed tracing** - Track requests across microservices
- **Metrics** - Collect performance indicators (latency, throughput, errors)
- **Logs** - Structured logging with trace correlation
- **Auto-instrumentation** - Automatic HTTP, database, and framework instrumentation

**Benefits:**
- Vendor-agnostic (works with Datadog, New Relic, Honeycomb, Jaeger, etc.)
- Standardized telemetry data format
- Rich ecosystem of exporters and plugins
- Future-proof (CNCF graduated project)

## Architecture

```
┌─────────────┐
│  Frontend   │──────┐
│  (Browser)  │      │
└─────────────┘      │
                     ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│     API     │─▶│ OTel Collector│─▶│  Backend    │
│   Server    │  └──────────────┘  │  (Datadog,  │
└─────────────┘          │          │  Jaeger,    │
       │                 │          │  Grafana)   │
       ▼                 │          └─────────────┘
┌─────────────┐          │
│  Database   │◀─────────┘
└─────────────┘
```

## Installation

### Backend Services (Node.js)

```bash
npm install @opentelemetry/api \
            @opentelemetry/sdk-node \
            @opentelemetry/auto-instrumentations-node \
            @opentelemetry/exporter-trace-otlp-http \
            @opentelemetry/exporter-metrics-otlp-http \
            --workspace=apps/api
```

### Frontend (Browser)

```bash
npm install @opentelemetry/api \
            @opentelemetry/sdk-trace-web \
            @opentelemetry/instrumentation-document-load \
            @opentelemetry/instrumentation-fetch \
            @opentelemetry/exporter-trace-otlp-http \
            --workspace=apps/web
```

## Configuration

### Environment Variables

Add to `config/env/.env.example`:

```bash
# OpenTelemetry Configuration
OTEL_SERVICE_NAME=political-sphere-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318  # OTel Collector endpoint
OTEL_EXPORTER_OTLP_HEADERS=x-api-key=<your-api-key>  # For cloud backends
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1  # 10% sampling rate
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
```

### Backend Setup

**Create instrumentation file (apps/api/src/instrumentation.ts):**

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'political-sphere-api',
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
});

const traceExporter = new OTLPTraceExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
});

const metricExporter = new OTLPMetricExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
  headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000, // Export every 60 seconds
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable file system instrumentation (too noisy)
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingPaths: ['/health', '/metrics'], // Ignore health checks
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true, // PostgreSQL
      },
    }),
  ],
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down'))
    .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error));
});

function parseHeaders(headers?: string): Record<string, string> {
  if (!headers) return {};
  return Object.fromEntries(
    headers.split(',').map(h => h.split('='))
  );
}
```

**Update application entry point (apps/api/src/server.ts):**

```typescript
// MUST be first import (before any other imports)
import './instrumentation.js';

import express from 'express';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const app = express();
const tracer = trace.getTracer('political-sphere-api');

// Middleware to add trace context to logs
app.use((req, res, next) => {
  const span = trace.getActiveSpan();
  if (span) {
    req.traceId = span.spanContext().traceId;
    req.spanId = span.spanContext().spanId;
  }
  next();
});

// ... rest of application setup ...
```

### Frontend Setup

**Create instrumentation file (apps/web/src/instrumentation.ts):**

```typescript
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export function initOpenTelemetry() {
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'political-sphere-web',
    [SemanticResourceAttributes.SERVICE_VERSION]: import.meta.env.VITE_APP_VERSION || '1.0.0',
  });

  const provider = new WebTracerProvider({
    resource,
  });

  const exporter = new OTLPTraceExporter({
    url: `${import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
    headers: {
      'x-api-key': import.meta.env.VITE_OTEL_API_KEY || '',
    },
  });

  provider.addSpanProcessor(new BatchSpanProcessor(exporter, {
    maxQueueSize: 100,
    maxExportBatchSize: 10,
    scheduledDelayMillis: 500,
  }));

  provider.register();

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [
          new RegExp(`${import.meta.env.VITE_API_URL}/.*`),
        ],
        clearTimingResources: true,
      }),
    ],
  });
}
```

**Initialize in main entry point (apps/web/src/main.tsx):**

```typescript
import { initOpenTelemetry } from './instrumentation';

if (import.meta.env.PROD) {
  initOpenTelemetry();
}

// ... rest of React application bootstrap ...
```

## Usage

### Manual Spans

**Backend (Node.js):**

```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('political-sphere-api');

export async function processVote(voteData: VoteInput) {
  // Create a new span
  return tracer.startActiveSpan('processVote', async (span) => {
    try {
      // Add attributes (metadata)
      span.setAttribute('vote.billId', voteData.billId);
      span.setAttribute('vote.userId', voteData.userId);
      span.setAttribute('vote.value', voteData.value);

      // Add event (checkpoint within span)
      span.addEvent('vote_validated', {
        validationDuration: 12,
      });

      const result = await voteRepository.create(voteData);

      // Mark span as successful
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      // Record error
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      // Always end span
      span.end();
    }
  });
}
```

**Frontend (React):**

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('political-sphere-web');

export function VotingComponent() {
  const handleVote = async (billId: string, value: number) => {
    return tracer.startActiveSpan('user_vote', async (span) => {
      try {
        span.setAttribute('bill.id', billId);
        span.setAttribute('vote.value', value);

        const response = await fetch('/api/votes', {
          method: 'POST',
          body: JSON.stringify({ billId, value }),
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return response.json();
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  };

  // ... component render ...
}
```

### Metrics Collection

**Backend custom metrics:**

```typescript
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('political-sphere-api');

// Counter: Monotonically increasing value
const voteCounter = meter.createCounter('votes.total', {
  description: 'Total number of votes cast',
  unit: '1',
});

// Histogram: Distribution of values
const voteProcessingDuration = meter.createHistogram('votes.processing.duration', {
  description: 'Time to process vote',
  unit: 'ms',
});

// Gauge: Current value (not cumulative)
const activeConnections = meter.createUpDownCounter('http.connections.active', {
  description: 'Number of active HTTP connections',
});

// Usage
export async function createVote(data: VoteInput) {
  const start = Date.now();
  
  activeConnections.add(1);
  
  try {
    const result = await voteService.create(data);
    
    voteCounter.add(1, {
      billId: data.billId,
      value: data.value,
    });
    
    const duration = Date.now() - start;
    voteProcessingDuration.record(duration, {
      success: true,
    });
    
    return result;
  } catch (error) {
    voteProcessingDuration.record(Date.now() - start, {
      success: false,
    });
    throw error;
  } finally {
    activeConnections.add(-1);
  }
}
```

## Deployment

### Option 1: OpenTelemetry Collector (Recommended)

**Benefits:**
- Centralized telemetry collection
- Protocol translation (OTLP → Datadog, Jaeger, etc.)
- Batching and buffering
- Sampling and filtering

**Docker Compose (docker-compose.otel.yml):**

```yaml
version: '3.8'

services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ['--config=/etc/otel-collector-config.yaml']
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - '4318:4318'  # OTLP HTTP receiver
      - '4317:4317'  # OTLP gRPC receiver
      - '8888:8888'  # Prometheus metrics
      - '13133:13133' # Health check
    environment:
      - DATADOG_API_KEY=${DATADOG_API_KEY}
```

**Collector Configuration (otel-collector-config.yaml):**

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024
  
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
  
  # Sample 10% of traces
  probabilistic_sampler:
    sampling_percentage: 10

exporters:
  # Export to Datadog
  datadog:
    api:
      key: ${env:DATADOG_API_KEY}
      site: datadoghq.com
  
  # Export to Jaeger (for local development)
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true
  
  # Log to console (debugging)
  logging:
    loglevel: info

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, probabilistic_sampler]
      exporters: [datadog, logging]
    
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [datadog, logging]
```

**Start collector:**

```bash
docker-compose -f docker-compose.otel.yml up -d
```

### Option 2: Direct Export to Backend

Export directly from application to observability backend (Datadog, Honeycomb, etc.):

```typescript
// apps/api/src/instrumentation.ts
import { DatadogSpanExporter } from '@opentelemetry/exporter-datadog';

const traceExporter = new DatadogSpanExporter({
  agentUrl: process.env.DD_AGENT_URL || 'http://localhost:8126',
});
```

## Observability Backends

### Jaeger (Local Development)

**Docker Compose:**

```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - '16686:16686'  # Web UI
      - '14250:14250'  # gRPC
      - '14268:14268'  # HTTP
    environment:
      - COLLECTOR_OTLP_ENABLED=true
```

**Access UI:** http://localhost:16686

### Datadog

**Environment variables:**

```bash
DATADOG_API_KEY=<your-api-key>
DATADOG_APP_KEY=<your-app-key>
DATADOG_SITE=datadoghq.com  # Or datadoghq.eu for EU
```

**View traces:** https://app.datadoghq.com/apm/traces

### Honeycomb

**Environment variables:**

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=<your-api-key>,x-honeycomb-dataset=political-sphere
```

**View traces:** https://ui.honeycomb.io/

### Grafana Cloud

**Environment variables:**

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-<region>.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64-encoded-credentials>
```

## Best Practices

### Sampling

**Production sampling rates:**
- **High-traffic services**: 1-10% (reduce overhead)
- **Low-traffic services**: 100% (capture all traces)
- **Critical paths**: 100% (voting, authentication)

**Configure sampling:**

```typescript
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

const provider = new WebTracerProvider({
  sampler: new TraceIdRatioBasedSampler(0.1), // 10% sampling
});
```

### Span Attributes

**Use semantic conventions:**

```typescript
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

span.setAttribute(SemanticAttributes.HTTP_METHOD, 'POST');
span.setAttribute(SemanticAttributes.HTTP_URL, req.url);
span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 200);
span.setAttribute(SemanticAttributes.DB_STATEMENT, 'SELECT * FROM users WHERE id = ?');
```

### Performance

1. **Batch exports** - Use `BatchSpanProcessor` to reduce network overhead
2. **Limit span attributes** - Only add essential metadata
3. **Sample aggressively** - 10% sampling reduces overhead by 90%
4. **Ignore health checks** - Exclude `/health`, `/metrics` endpoints

### Security

1. **Filter sensitive data** - Remove PII from span attributes
2. **Sanitize DB queries** - Don't include user data in SQL statements
3. **Secure collector** - Use TLS for collector communication
4. **API key rotation** - Rotate observability backend API keys quarterly

## Troubleshooting

### No traces appearing

**Check exporter endpoint:**
```bash
curl http://localhost:4318/v1/traces -v
```

**Enable debug logging:**
```bash
export OTEL_LOG_LEVEL=debug
npm run dev
```

**Verify collector health:**
```bash
curl http://localhost:13133
```

### High overhead

**Reduce sampling rate:**
```bash
export OTEL_TRACES_SAMPLER_ARG=0.01  # 1% sampling
```

**Disable auto-instrumentation:**
```typescript
instrumentations: [
  getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false },
    '@opentelemetry/instrumentation-dns': { enabled: false },
  }),
]
```

### Missing context propagation

**Ensure headers are propagated:**

```typescript
// Frontend fetch
fetch('/api/votes', {
  headers: {
    'traceparent': getCurrentTraceParent(),
  },
});

// Backend Express
import { propagation, context } from '@opentelemetry/api';

app.use((req, res, next) => {
  const ctx = propagation.extract(context.active(), req.headers);
  context.with(ctx, next);
});
```

## Testing

**Verify spans are created:**

```typescript
// apps/api/tests/instrumentation.test.ts
import { trace } from '@opentelemetry/api';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

describe('OpenTelemetry instrumentation', () => {
  it('should create span for vote processing', async () => {
    const exporter = new InMemorySpanExporter();
    const provider = new NodeTracerProvider();
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();

    const tracer = trace.getTracer('test');
    
    await tracer.startActiveSpan('test-span', async (span) => {
      span.setAttribute('test.attribute', 'value');
      span.end();
    });

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe('test-span');
    expect(spans[0].attributes['test.attribute']).toBe('value');
  });
});
```

## CI/CD Integration

**Add to `.github/workflows/ci.yml`:**

```yaml
- name: Run tests with tracing
  env:
    OTEL_EXPORTER_OTLP_ENDPOINT: http://localhost:4318
    OTEL_SERVICE_NAME: political-sphere-api-ci
  run: npm test
  
- name: Upload trace data
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: traces
    path: traces/
```

## Cost Management

### Datadog Pricing
- **APM**: $31/host/month + $0.013/indexed span
- **Logs**: $0.10/GB ingested

**Optimize:**
- Use 10% trace sampling
- Index only error spans and slow requests
- Set retention to 15 days (not 90 days)

### Honeycomb Pricing
- **Free**: 20M events/month
- **Pro**: $0.20/million events

**Optimize:**
- Use head-based sampling (10%)
- Enable derived columns instead of full traces
- Archive old traces to S3

## Further Reading

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Semantic Conventions](https://opentelemetry.io/docs/reference/specification/trace/semantic_conventions/)
- [Error Monitoring Integration](./error-monitoring-integration.md)
- [Incident Response Playbooks](./incident-playbooks/)
- [Structured Logging Guide](./structured-logging.md)
