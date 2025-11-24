# Observability and Monitoring System

## Overview

The Political Sphere application includes a comprehensive observability and monitoring system designed for enterprise-grade reliability, performance tracking, and compliance. This system provides real-time insights into application health, performance metrics, error tracking, and security compliance.

## Architecture

The observability system is built around several key components:

- **Metrics Collection**: Prometheus-based metrics with custom application metrics
- **Health Checks**: Comprehensive health monitoring for all system components
- **Error Tracking**: Integrated error reporting with Sentry support
- **Logging**: Structured logging with aggregation capabilities
- **Alerting**: Configurable alerting rules with multiple notification channels
- **Compliance**: Enterprise compliance features including audit trails and data retention

## Components

### 1. Metrics Collection (`metrics.ts`)

**Features:**

- Prometheus-compatible metrics collection
- HTTP request/response metrics
- Database connection monitoring
- Cache performance metrics
- Business logic error tracking
- External API call monitoring
- System resource usage (memory, CPU)

**Key Metrics:**

- `political_sphere_api_http_requests_total`: Total HTTP requests by method, route, and status
- `political_sphere_api_http_request_duration_seconds`: Request duration histograms
- `political_sphere_api_active_connections`: Active connection count
- `political_sphere_api_memory_usage_bytes`: Memory usage tracking
- `political_sphere_api_business_logic_errors_total`: Application error counts

### 2. Health Checks (`health.ts`)

**Health Check Types:**

- **System Resources**: Memory and CPU usage monitoring
- **Database Connectivity**: Database connection validation
- **External Services**: Third-party API availability checks
- **Application Components**: Internal service health

**Endpoints:**

- `GET /health`: Basic health status (up/down)
- `GET /health/detailed`: Comprehensive health check results

### 3. Error Tracking (`error-tracking.ts`)

**Features:**

- Sentry integration for error reporting
- Automatic error context capture
- Sensitive data sanitization
- Error buffering for high-throughput scenarios
- Compliance-aware error handling

**Error Context Captured:**

- User information (anonymized)
- Request details
- Session information
- Component and operation context

### 4. Logging System (`logging.ts`)

**Features:**

- Structured JSON logging
- Multiple transport support (console, file, HTTP)
- Request/response logging
- Business logic operation logging
- Security event logging
- Performance metric logging

**Log Levels:**

- `error`: Application errors and failures
- `warn`: Warnings and security events
- `info`: General information and business logic
- `debug`: Detailed debugging information

### 5. Alerting System (`alerting.ts`)

**Alert Rules:**

- High error rate detection (>10% error rate)
- Response time degradation (>5 seconds 95th percentile)
- Memory usage alerts (>90% usage)
- Application downtime detection
- Database connection issues

**Notification Channels:**

- Slack webhooks
- Discord webhooks
- Email notifications (configurable)

### 6. Compliance Features (`compliance.ts`)

**Compliance Frameworks Supported:**

- **GDPR**: Data protection and privacy compliance
- **SOC 2**: Security, availability, and confidentiality controls
- **HIPAA**: Healthcare data protection (configurable)

**Features:**

- Audit trail logging for sensitive operations
- Data retention policy enforcement
- PII data anonymization
- Consent management framework
- Compliance reporting

## Configuration

### Environment Variables

```bash
# Error Tracking
SENTRY_DSN=your_sentry_dsn_here

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/political-sphere/app.log

# Metrics
METRICS_PREFIX=political_sphere_api
```

### Programmatic Configuration

```typescript
import {
  initializeMetrics,
  initializeErrorTracking,
  initializeLogging,
  getHealthCheckService,
  getComplianceService,
} from '@political-sphere/observability';

// Initialize all observability systems
const metrics = initializeMetrics({
  prefix: 'political_sphere_api',
  labels: { service: 'api', version: '1.0.0' },
});

const errorTracker = await initializeErrorTracking({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

const logger = initializeLogging({
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
});

const healthService = getHealthCheckService();
const complianceService = getComplianceService({
  gdprCompliance: true,
  soc2Compliance: true,
});
```

## API Endpoints

### Health Endpoints

```bash
# Basic health check
GET /health
# Response: {"status": "healthy", "timestamp": "...", "service": "api"}

# Detailed health checks
GET /health/detailed
# Response: {"timestamp": "...", "service": "api", "checks": [...]}
```

### Metrics Endpoint

```bash
# Prometheus metrics
GET /metrics
# Response: Prometheus-formatted metrics
```

## Monitoring Scripts

### Generate Alerting Configuration

```bash
node scripts/observability/generate-alerts.mjs [output-directory]
```

Generates:

- `prometheus-rules.yml`: Alerting rules for Prometheus
- `alertmanager.yml`: Alertmanager notification configuration
- `docker-compose.monitoring.yml`: Complete monitoring stack

### Generate Dashboards

```bash
node scripts/observability/generate-dashboard.mjs <template> <output-file>
```

Available templates:

- `application-overview`: High-level application metrics
- `error-monitoring`: Error tracking and analysis
- `database-monitoring`: Database performance metrics
- `performance-monitoring`: Detailed performance analysis

## Dashboard Templates

### Application Overview Dashboard

- Application uptime and availability
- Request rate and error rate trends
- Response time percentiles
- Resource usage (memory, connections)
- Top error routes

### Error Monitoring Dashboard

- Total error counts and trends
- HTTP error rate analysis
- Errors by component and route
- External API error tracking
- Error spike detection

### Database Monitoring Dashboard

- Active connection counts
- Query performance metrics
- Cache hit rates
- Slow query identification
- Database error tracking

### Performance Monitoring Dashboard

- Response time distributions
- Throughput metrics
- Resource utilization trends
- Performance budget compliance
- Core Web Vitals (when applicable)

## Compliance Features

### Audit Logging

All sensitive operations are automatically logged with compliance flags:

```typescript
complianceService.logAuditEvent({
  userId: 'user123',
  action: 'data_access',
  resource: 'user_data',
  resourceId: 'user456',
  success: true,
  ipAddress: '192.168.1.1',
  details: { fieldsAccessed: ['email', 'name'] },
});
```

### Data Retention

Automatic enforcement of retention policies:

```typescript
// Check if data should be retained
const shouldRetain = complianceService.shouldRetainData('user_data', user.createdAt);

// Get retention policy
const policy = complianceService.getRetentionPolicy('audit_log');
```

### Data Anonymization

GDPR-compliant data anonymization:

```typescript
const anonymizedData = complianceService.anonymizeData({
  email: 'user@example.com',
  name: 'John Doe',
  ipAddress: '192.168.1.1',
});
// Result: { name: '[REDACTED]', ipAddress: '[REDACTED]' }
```

## Integration Examples

### Express Middleware Integration

```typescript
import express from 'express';
import { getMetricsCollector, getLogger } from '@political-sphere/observability';

const app = express();
const metrics = getMetricsCollector();
const logger = getLogger();

// Request metrics middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.recordHttpRequest(
      req.method || 'GET',
      req.route?.path || req.path,
      res.statusCode,
      duration / 1000
    );
    logger.logRequest(req, res, duration);
  });
  next();
});
```

### Error Handling Integration

```typescript
import { getErrorTracker, getComplianceService } from '@political-sphere/observability';

const errorTracker = getErrorTracker();
const compliance = getComplianceService();

// Global error handler
app.use((err, req, res, next) => {
  // Track error
  errorTracker.captureException(err, {
    userId: req.user?.id,
    requestId: req.get('x-request-id'),
    component: 'api',
  });

  // Log audit event for errors
  if (compliance.requiresAudit('error_occurred', 'application')) {
    compliance.logAuditEvent({
      userId: req.user?.id,
      action: 'error_occurred',
      resource: 'application',
      success: false,
      ipAddress: req.ip,
      details: { error: err.message, route: req.path },
    });
  }

  res.status(500).json({ error: 'Internal server error' });
});
```

## Performance Considerations

### Metrics Collection

- Metrics are collected in-memory with minimal overhead
- Prometheus scraping is efficient and doesn't block application threads
- Default metrics collection can be disabled for high-performance scenarios

### Logging

- Structured logging reduces I/O overhead
- Log buffering prevents blocking on slow I/O operations
- Asynchronous logging prevents application thread blocking

### Health Checks

- Health checks run in parallel to minimize response time impact
- Timeout protection prevents hanging health checks
- Caching of health check results for high-frequency monitoring

## Security Considerations

### Data Sanitization

- Automatic PII detection and redaction in logs and error reports
- Configurable sensitive data patterns
- Compliance-aware data handling

### Access Control

- Metrics endpoints can be protected with authentication
- Audit logs are tamper-evident (when properly configured)
- Secure transmission of monitoring data

### Compliance

- GDPR-compliant data handling and retention
- SOC 2 Type II controls for security monitoring
- HIPAA-ready configuration for healthcare deployments

## Troubleshooting

### Common Issues

1. **Metrics not appearing in Prometheus**
   - Check `/metrics` endpoint accessibility
   - Verify Prometheus scrape configuration
   - Ensure metrics are being collected (check application logs)

2. **Health checks failing**
   - Verify database connectivity
   - Check external service availability
   - Review system resource usage

3. **Errors not appearing in Sentry**
   - Verify DSN configuration
   - Check network connectivity to Sentry
   - Review error filtering rules

4. **High memory usage**
   - Disable default metrics collection if not needed
   - Reduce log retention periods
   - Implement metrics aggregation

### Debug Commands

```bash
# Check metrics endpoint
curl http://localhost:3000/metrics

# Test health checks
curl http://localhost:3000/health/detailed

# Generate monitoring configuration
node scripts/observability/generate-alerts.mjs monitoring-config

# Generate dashboard
node scripts/observability/generate-dashboard.mjs application-overview dashboard.json
```

## Enterprise Features

### High Availability

- Distributed tracing support
- Multi-region deployment monitoring
- Cross-service dependency tracking

### Scalability

- Horizontal scaling metrics
- Load balancer monitoring
- Auto-scaling triggers

### Compliance Automation

- Automated compliance reporting
- Audit trail analysis
- Data retention enforcement
- Incident response automation

## Summary

The observability system provides enterprise-grade monitoring capabilities with:

- **Comprehensive Metrics**: 15+ key metrics covering all aspects of application performance
- **Multi-level Health Checks**: System, database, and external service monitoring
- **Advanced Error Tracking**: Sentry integration with compliance-aware error handling
- **Structured Logging**: JSON-formatted logs with multiple transport options
- **Intelligent Alerting**: Prometheus-based alerting with Slack/Discord notifications
- **Enterprise Compliance**: GDPR, SOC 2, and HIPAA-ready compliance features
- **Automated Dashboard Generation**: Grafana dashboard templates for quick setup
- **Configuration Scripts**: Automated generation of monitoring infrastructure

This system ensures the Political Sphere application maintains high availability, performance, and compliance standards while providing actionable insights for development and operations teams.
