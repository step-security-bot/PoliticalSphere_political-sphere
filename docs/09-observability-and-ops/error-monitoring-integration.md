# Error Monitoring Integration Guide

**Version:** 1.0.0  
**Last Updated:** 2025-11-14  
**Status:** Recommended

## Overview

This guide documents integration of error monitoring platforms (Sentry, Datadog, or similar) for real-time error tracking, alerting, and debugging across Political Sphere applications.

## Supported Platforms

### Sentry (Recommended)

**Pros:**
- Excellent error grouping and deduplication
- Rich context (breadcrumbs, user data, stack traces)
- Generous free tier (5,000 events/month)
- Strong TypeScript/Node.js support
- Built-in release tracking and source maps

**Use cases:**
- Frontend error monitoring (React, TypeScript)
- Backend API error tracking (Node.js, Express)
- Performance monitoring (transactions, spans)

### Datadog

**Pros:**
- Unified logs, metrics, traces, and errors
- Advanced APM (Application Performance Monitoring)
- Infrastructure monitoring integration
- Custom dashboards and alerting

**Use cases:**
- Enterprise-scale observability
- Multi-service distributed tracing
- Log aggregation with error correlation

## Integration: Sentry

### 1. Installation

**Backend (API, Worker, Game Server):**
```bash
npm install @sentry/node @sentry/profiling-node --workspace=apps/api
npm install @sentry/node @sentry/profiling-node --workspace=apps/worker
npm install @sentry/node @sentry/profiling-node --workspace=apps/game-server
```

**Frontend (Web, Shell, Feature Remotes):**
```bash
npm install @sentry/react --workspace=apps/web
npm install @sentry/react --workspace=apps/shell
```

### 2. Configuration

**Environment Variables:**

Add to `config/env/.env.example`:
```bash
# Sentry Configuration
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
SENTRY_ENVIRONMENT=development  # development | staging | production
SENTRY_RELEASE=political-sphere@1.0.0
SENTRY_SAMPLE_RATE=1.0  # 1.0 = 100% of errors, 0.1 = 10% of errors
SENTRY_TRACES_SAMPLE_RATE=0.1  # 0.1 = 10% of transactions for performance monitoring
```

**Backend Setup (apps/api/src/sentry.ts):**
```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    release: process.env.SENTRY_RELEASE,
    
    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: 1.0, // Profile 100% of sampled transactions
    
    integrations: [
      new ProfilingIntegration(),
    ],
    
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      
      // Remove sensitive user data
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      
      return event;
    },
  });
}
```

**Frontend Setup (apps/web/src/sentry.ts):**
```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    release: import.meta.env.VITE_SENTRY_RELEASE,
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(crumb => {
          if (crumb.data?.email) delete crumb.data.email;
          if (crumb.data?.password) delete crumb.data.password;
          return crumb;
        });
      }
      
      return event;
    },
  });
}
```

### 3. Usage

**Express Error Handler (apps/api/src/server.ts):**
```typescript
import express from 'express';
import * as Sentry from '@sentry/node';
import { initSentry } from './sentry.js';

const app = express();

// Initialize Sentry BEFORE other middleware
initSentry();

// RequestHandler creates a separate execution context for each request
app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// ... your routes ...

// ErrorHandler must be BEFORE any other error middleware and AFTER all controllers
app.use(Sentry.Handlers.errorHandler());

// Custom error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
```

**Manual Error Capture:**
```typescript
import * as Sentry from '@sentry/node';

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      operation: 'riskyOperation',
      severity: 'high',
    },
    extra: {
      userId: user.id,
      requestId: req.id,
    },
  });
  
  throw error; // Re-throw or handle
}
```

**Add User Context:**
```typescript
Sentry.setUser({
  id: user.id,
  username: user.username,
  // Do NOT include email or PII (filtered in beforeSend)
});
```

**Custom Messages:**
```typescript
Sentry.captureMessage('Unusual activity detected', {
  level: 'warning',
  tags: {
    feature: 'voting',
  },
  extra: {
    threshold: 100,
    actual: 150,
  },
});
```

### 4. Source Maps (Production)

**Backend (Node.js):**

Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSources": true
  }
}
```

Upload source maps after build:
```bash
npx @sentry/cli sourcemaps upload --org=political-sphere --project=api ./dist
```

**Frontend (Vite):**

Install Sentry Vite plugin:
```bash
npm install @sentry/vite-plugin --save-dev --workspace=apps/web
```

Add to `vite.config.ts`:
```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default {
  build: {
    sourcemap: true,
  },
  plugins: [
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: './dist/**',
      },
    }),
  ],
};
```

### 5. CI/CD Integration

**Create Sentry Release (.github/workflows/deploy.yml):**
```yaml
- name: Create Sentry Release
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: political-sphere
    SENTRY_PROJECT: api
  run: |
    npx @sentry/cli releases new ${{ github.sha }}
    npx @sentry/cli releases set-commits ${{ github.sha }} --auto
    npx @sentry/cli releases finalize ${{ github.sha }}
```

**GitHub Secrets Required:**
- `SENTRY_AUTH_TOKEN` - Create at https://sentry.io/settings/account/api/auth-tokens/
- `SENTRY_DSN` - Project DSN from Sentry project settings

## Integration: Datadog

### 1. Installation

```bash
npm install dd-trace --workspace=apps/api
npm install @datadog/browser-logs --workspace=apps/web
```

### 2. Configuration

**Environment Variables:**
```bash
DD_API_KEY=<your-api-key>
DD_APP_KEY=<your-app-key>
DD_ENV=production
DD_SERVICE=political-sphere-api
DD_VERSION=1.0.0
DD_LOGS_INJECTION=true
```

**Backend Setup (apps/api/src/server.ts):**
```typescript
import tracer from 'dd-trace';

// Initialize tracer FIRST (before any imports)
tracer.init({
  service: 'political-sphere-api',
  env: process.env.DD_ENV || 'development',
  version: process.env.DD_VERSION,
  logInjection: true,
  runtimeMetrics: true,
});

// ... rest of application imports ...
```

**Frontend Setup (apps/web/src/datadog.ts):**
```typescript
import { datadogLogs } from '@datadog/browser-logs';

export function initDatadog() {
  datadogLogs.init({
    clientToken: import.meta.env.VITE_DD_CLIENT_TOKEN,
    site: 'datadoghq.com',
    service: 'political-sphere-web',
    env: import.meta.env.VITE_DD_ENV || 'development',
    version: import.meta.env.VITE_DD_VERSION,
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
  });
}
```

### 3. Usage

**Error Logging:**
```typescript
import { datadogLogs } from '@datadog/browser-logs';

datadogLogs.logger.error('Error message', {
  error: err,
  context: {
    userId: user.id,
    operation: 'vote',
  },
});
```

## Best Practices

### Privacy & Security

1. **Filter PII** - Use `beforeSend` hook to remove email, IP addresses, passwords
2. **Sanitize breadcrumbs** - Remove sensitive form inputs, API keys from logs
3. **Rate limiting** - Configure sample rates to avoid overwhelming monitoring services
4. **User consent** - For session replay, obtain explicit user consent (GDPR requirement)

### Performance

1. **Sample traces** - Use `tracesSampleRate: 0.1` (10%) in production to reduce overhead
2. **Batch events** - Configure SDK to batch error reports, not send individually
3. **Filter noise** - Ignore known errors (e.g., browser extensions, network failures)

### Alerting

1. **Error spikes** - Alert when error rate exceeds 1% of requests
2. **Critical errors** - Immediate alerts for 5xx errors, authentication failures
3. **Performance degradation** - Alert when p95 latency exceeds 500ms
4. **On-call rotation** - Integrate with PagerDuty, OpsGenie for incident escalation

### Debugging

1. **Add context** - Include request IDs, user IDs, operation names in error tags
2. **Use breadcrumbs** - Log user actions leading up to errors
3. **Link to logs** - Include trace IDs to correlate errors with structured logs
4. **Source maps** - Always upload source maps for production builds

## Testing

**Test Sentry integration locally:**
```bash
# Set environment variable
export SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>

# Trigger test error
curl http://localhost:3000/api/test-error

# Check Sentry dashboard for error event
```

**Verify error filtering:**
```typescript
// apps/api/tests/sentry.test.ts
import { describe, it, expect, vi } from 'vitest';
import * as Sentry from '@sentry/node';

describe('Sentry configuration', () => {
  it('should filter authorization headers', () => {
    const beforeSend = Sentry.getCurrentHub().getClient()?.getOptions().beforeSend;
    
    const event = {
      request: {
        headers: {
          authorization: 'Bearer secret-token',
          'content-type': 'application/json',
        },
      },
    };
    
    const filtered = beforeSend?.(event, {});
    expect(filtered?.request?.headers?.authorization).toBeUndefined();
    expect(filtered?.request?.headers?.['content-type']).toBe('application/json');
  });
});
```

## Cost Management

### Sentry Pricing

- **Developer (Free):** 5,000 events/month, 1 user
- **Team ($26/month):** 50,000 events/month, 20GB attachments
- **Business ($80/month):** 100,000 events/month, 50GB attachments

**Optimize costs:**
- Use sample rates (`tracesSampleRate: 0.1`)
- Filter known errors (e.g., `ignoreErrors: ['NetworkError']`)
- Set event retention to 30 days (not 90 days)

### Datadog Pricing

- **Logs:** $0.10/GB ingested (after 5GB free)
- **APM:** $31/host/month + $0.013/indexed span
- **Infrastructure:** $15/host/month

**Optimize costs:**
- Use log sampling and filtering
- Index only critical spans (errors, slow requests)
- Right-size retention periods

## Compliance

### GDPR Requirements

1. **Data minimization** - Only send necessary context to error monitoring
2. **Right to erasure** - Implement process to delete user data from Sentry/Datadog on DSAR
3. **Data processing agreement** - Sign DPA with Sentry or Datadog
4. **EU data residency** - Use EU Sentry region or Datadog EU site

### Audit Trail

- Log error monitoring configuration changes to audit trail
- Track which users triggered errors (without storing PII)
- Retain error reports per retention policy (30-90 days)

## Further Reading

- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Datadog APM Documentation](https://docs.datadoghq.com/tracing/)
- [OpenTelemetry Integration](./performance-monitoring.md)
- [Incident Response Playbooks](./incident-playbooks/)
