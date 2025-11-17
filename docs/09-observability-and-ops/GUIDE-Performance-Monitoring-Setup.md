# Performance Monitoring Setup Guide

**Version**: 1.0.0  
**Date**: 2025-11-17  
**Author**: AI Development Agent

## Overview

This document outlines the performance monitoring strategy for the Political Sphere application, including Service Level Indicators (SLIs), Service Level Objectives (SLOs), alerting thresholds, and observability tooling.

---

## Service Level Indicators (SLIs)

### API Endpoints

**Critical Endpoints**:

| Endpoint | SLI Metric | Target | Measurement |
|----------|-----------|--------|-------------|
| `POST /auth/login` | Response Time (P95) | < 200ms | OpenTelemetry traces |
| `POST /auth/register` | Response Time (P95) | < 500ms | OpenTelemetry traces |
| `GET /api/news` | Response Time (P95) | < 150ms | OpenTelemetry traces |
| `POST /api/news` | Response Time (P95) | < 300ms | OpenTelemetry traces |
| `GET /health` | Response Time (P99) | < 50ms | Health check monitoring |

**Availability**:
- Target: 99.9% uptime (43 minutes downtime per month maximum)
- Measurement: Health check polling every 30 seconds

**Error Rate**:
- Target: < 0.1% of requests (999 successful requests per 1000)
- Measurement: HTTP status codes (5xx errors tracked separately from 4xx)

---

## Service Level Objectives (SLOs)

### Response Time SLOs

```javascript
// Example: Response time tracking
const SLO_TARGETS = {
  authentication: {
    p50: 50,   // 50th percentile: 50ms
    p95: 200,  // 95th percentile: 200ms
    p99: 500,  // 99th percentile: 500ms
  },
  api: {
    p50: 30,   // 50th percentile: 30ms
    p95: 150,  // 95th percentile: 150ms
    p99: 300,  // 99th percentile: 300ms
  },
  database: {
    p50: 10,   // 50th percentile: 10ms
    p95: 50,   // 95th percentile: 50ms
    p99: 100,  // 99th percentile: 100ms
  },
};
```

### Throughput SLOs

| Service | Metric | Target | Alert Threshold |
|---------|--------|--------|-----------------|
| API | Requests per second | 100 RPS | < 10 RPS or > 1000 RPS |
| Database | Queries per second | 500 QPS | < 50 QPS or > 5000 QPS |
| WebSocket | Connections | 1000 concurrent | > 900 (90% capacity) |

### Resource Utilization SLOs

| Resource | Target | Alert Threshold |
|----------|--------|-----------------|
| CPU | < 70% average | > 80% for 5 minutes |
| Memory | < 80% usage | > 90% for 5 minutes |
| Disk I/O | < 60% utilization | > 75% for 5 minutes |
| Network | < 50% bandwidth | > 70% for 5 minutes |

---

## Performance Monitoring Implementation

### 1. OpenTelemetry Metrics Collection

**Already Implemented** ✅:
- OpenTelemetry SDK configured in `libs/shared/src/telemetry.ts`
- OTLP metrics exporter sending to `localhost:4318/v1/metrics`
- Auto-instrumentation for HTTP, Express, database queries

**Metrics Collected**:
```typescript
// HTTP request duration
http.server.duration (histogram)
  - Attributes: http.method, http.route, http.status_code
  
// HTTP request count
http.server.request.count (counter)
  - Attributes: http.method, http.route, http.status_code
  
// Database query duration
db.client.operation.duration (histogram)
  - Attributes: db.system, db.operation, db.name
  
// Active connections
http.server.active_requests (gauge)
```

### 2. Custom Metrics

**Validation Performance Metrics** ✅:

Already implemented in `apps/api/tests/helpers/validation-metrics.js`:

```javascript
// Metrics available via GET /api/metrics/validation
{
  global: {
    totalRequests: 1000,
    success: 950,
    failure: 50,
    successRate: 95,
    avgParseTime: 0.15
  },
  routes: {
    'POST /api/news': {
      total: 500,
      success: 480,
      failure: 20,
      successRate: 96,
      avgParseTime: 0.12
    }
  }
}
```

**Business Metrics to Add**:

```javascript
// User engagement metrics
{
  activeUsers: 250,        // Users active in last 5 minutes
  newRegistrations: 42,    // Registrations in last hour
  votescast: 128,          // Votes cast in last hour
  articlesCreated: 15,     // Articles created in last hour
}

// System health metrics
{
  uptime: 86400,           // Uptime in seconds
  restarts: 0,             // Number of restarts in last 24 hours
  errorRate: 0.05,         // Percentage of requests with errors
  avgResponseTime: 45.2,   // Average response time (ms)
}
```

### 3. Prometheus Integration

**Setup Steps**:

1. **Install Prometheus Exporter**:
```bash
npm install @opentelemetry/exporter-prometheus
```

2. **Configure Prometheus Endpoint**:
```typescript
// apps/api/src/metrics.ts
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

export function setupPrometheusExporter() {
  const prometheusExporter = new PrometheusExporter(
    {
      port: 9464, // Prometheus scrape endpoint
      endpoint: '/metrics',
    },
    () => {
      console.log('Prometheus scrape endpoint: http://localhost:9464/metrics');
    }
  );
  
  return prometheusExporter;
}
```

3. **Prometheus Configuration** (`prometheus.yml`):
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['localhost:9464']
        labels:
          service: 'api'
          environment: 'production'
          
  - job_name: 'worker'
    static_configs:
      - targets: ['localhost:9465']
        labels:
          service: 'worker'
          environment: 'production'
```

### 4. Grafana Dashboards

**Dashboard 1: API Performance**

Panels:
- Request rate (requests per second)
- Response time (P50, P95, P99)
- Error rate (4xx, 5xx)
- Active connections
- CPU and memory usage

**Dashboard 2: User Engagement**

Panels:
- Active users (real-time)
- Registrations per hour
- Votes cast per hour
- Articles created per hour
- User sessions duration

**Dashboard 3: Database Performance**

Panels:
- Query duration (P50, P95, P99)
- Queries per second
- Connection pool usage
- Slow query count
- Database CPU/memory

---

## Alerting Strategy

### Critical Alerts (PagerDuty/On-call)

| Alert | Condition | Action |
|-------|-----------|--------|
| **Service Down** | Health check fails for 2+ minutes | Immediate page |
| **High Error Rate** | Error rate > 5% for 5 minutes | Immediate page |
| **P99 Latency** | P99 latency > 2 seconds for 10 minutes | Immediate page |
| **Database Down** | Database connection fails | Immediate page |

### Warning Alerts (Slack/Email)

| Alert | Condition | Action |
|-------|-----------|--------|
| **Elevated Error Rate** | Error rate > 1% for 10 minutes | Slack notification |
| **High Latency** | P95 latency > 500ms for 15 minutes | Slack notification |
| **High CPU Usage** | CPU > 80% for 10 minutes | Slack notification |
| **High Memory Usage** | Memory > 90% for 10 minutes | Slack notification |

### Informational Alerts (Logs)

| Alert | Condition | Action |
|-------|-----------|--------|
| **Slow Query** | Query duration > 1 second | Log warning |
| **Rate Limit Hit** | User hits rate limit | Log info |
| **Authentication Failure** | Failed login attempt | Log security event |

---

## Performance Benchmarking

### Baseline Performance

**API Response Times** (as of 2025-11-17):

| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| `GET /health` | 5ms | 10ms | 15ms |
| `POST /auth/login` | TBD | TBD | TBD |
| `GET /api/news` | TBD | TBD | TBD |
| `POST /api/news` | TBD | TBD | TBD |

**Validation Performance**:
- Average schema parse time: 0.0030ms
- P95 parse time: 0.0044ms
- 100% of validations < 0.01ms

### Load Testing

**Test Scenarios**:

1. **Normal Load**:
   - 100 concurrent users
   - 10 requests per second per user
   - Duration: 10 minutes
   - Expected: P95 < 200ms, error rate < 0.1%

2. **Peak Load**:
   - 500 concurrent users
   - 20 requests per second per user
   - Duration: 5 minutes
   - Expected: P95 < 500ms, error rate < 1%

3. **Stress Test**:
   - 1000 concurrent users
   - 50 requests per second per user
   - Duration: 2 minutes
   - Expected: Graceful degradation, no crashes

**Load Testing Tools**:
- k6 (preferred): Scriptable load testing
- Artillery: Scenario-based testing
- Apache JMeter: GUI-based testing

---

## Observability Stack

### Current Setup

✅ **Implemented**:
- Pino structured logging (JSON format)
- Correlation IDs for request tracing
- OpenTelemetry SDK with auto-instrumentation
- OTLP exporters for traces and metrics

⚠️ **In Progress**:
- Prometheus metrics endpoint
- Grafana dashboards
- Alerting rules

❌ **Not Implemented**:
- Centralized log aggregation (ELK, Loki)
- Distributed tracing backend (Jaeger, Tempo)
- APM (Application Performance Monitoring)

### Recommended Stack

**Option 1: Open Source**
- **Logs**: Loki (log aggregation) + Grafana (visualization)
- **Metrics**: Prometheus (storage) + Grafana (visualization)
- **Traces**: Tempo (storage) + Grafana (visualization)
- **Alerts**: Alertmanager + PagerDuty integration

**Option 2: Cloud-Native (AWS)**
- **Logs**: CloudWatch Logs
- **Metrics**: CloudWatch Metrics
- **Traces**: AWS X-Ray
- **Alerts**: CloudWatch Alarms + SNS

**Option 3: SaaS**
- **All-in-one**: Datadog, New Relic, or Dynatrace
- **Pros**: Fully managed, easy setup, powerful features
- **Cons**: Higher cost, vendor lock-in

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

1. ✅ OpenTelemetry SDK integration (DONE)
2. ✅ Structured logging with Pino (DONE)
3. ⏳ Add Prometheus exporter
4. ⏳ Create basic Grafana dashboards
5. ⏳ Set up health check monitoring

### Phase 2: Observability (Week 2)

6. ⏳ Deploy Prometheus server
7. ⏳ Deploy Grafana server
8. ⏳ Configure Loki for log aggregation
9. ⏳ Deploy Tempo for distributed tracing
10. ⏳ Create comprehensive dashboards

### Phase 3: Alerting (Week 3)

11. ⏳ Configure Alertmanager
12. ⏳ Define alerting rules (critical, warning, info)
13. ⏳ Integrate with PagerDuty/Slack
14. ⏳ Test alert escalation paths
15. ⏳ Document on-call procedures

### Phase 4: Advanced Monitoring (Week 4)

16. ⏳ Implement custom business metrics
17. ⏳ Set up load testing pipeline
18. ⏳ Create performance regression tests
19. ⏳ Implement SLO tracking
20. ⏳ Establish performance baselines

---

## Monitoring Checklist

### Pre-Production

- [ ] Prometheus exporter configured
- [ ] Grafana dashboards created
- [ ] Alerting rules defined
- [ ] Health checks enabled
- [ ] Load testing completed
- [ ] Performance baselines established
- [ ] On-call rotation defined
- [ ] Runbooks documented

### Production

- [ ] Centralized logging active
- [ ] Distributed tracing enabled
- [ ] Real-time alerting configured
- [ ] SLO tracking dashboards live
- [ ] Incident response procedures tested
- [ ] Performance monitoring automated
- [ ] Capacity planning dashboards active
- [ ] Security monitoring integrated

---

## Best Practices

### Do's ✅

1. **Monitor business metrics**, not just technical metrics
2. **Set realistic SLOs** based on actual user requirements
3. **Test alerts** regularly to ensure they fire correctly
4. **Document runbooks** for common incidents
5. **Review metrics** weekly to identify trends
6. **Correlate logs, traces, and metrics** for faster debugging
7. **Use structured logging** for easier querying
8. **Tag metrics** with relevant dimensions (environment, service, endpoint)

### Don'ts ❌

1. **Don't alert on everything** - focus on actionable alerts
2. **Don't ignore warning alerts** - they prevent critical alerts
3. **Don't forget to set alert fatigue prevention** (throttling, grouping)
4. **Don't monitor in silos** - use correlated observability
5. **Don't skip performance regression tests**
6. **Don't hardcode thresholds** - make them configurable
7. **Don't neglect business metrics** for technical metrics

---

## Resources

### Official Documentation

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Pino Logger Documentation](https://getpino.io/)

### Internal Documentation

- [OpenTelemetry Integration](../../libs/shared/src/telemetry.ts)
- [Pino Logger Implementation](../../libs/shared/src/logger-pino.js)
- [Validation Metrics](../../apps/api/tests/helpers/validation-metrics.js)
- [Security Audit](./SECURITY-AUDIT-OWASP-2025-11-17.md)

---

## Conclusion

This performance monitoring setup provides a solid foundation for observability in the Political Sphere application. The combination of OpenTelemetry, Pino logging, and Prometheus/Grafana creates a comprehensive monitoring stack that enables:

- **Proactive issue detection** through alerting
- **Fast incident resolution** through correlated observability
- **Performance optimization** through metrics tracking
- **Capacity planning** through trend analysis
- **SLO tracking** for reliability commitments

**Next Steps**:
1. Complete Phase 1 (Prometheus exporter and basic dashboards)
2. Set up load testing pipeline
3. Establish performance baselines
4. Deploy full observability stack (Phase 2)
5. Configure comprehensive alerting (Phase 3)

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-17  
**Next Review**: 2026-02-17 (Quarterly)
