# Observability and Monitoring

This directory contains scripts and configurations for implementing comprehensive observability and monitoring for the CI/CD pipeline and applications.

## Overview

Phase 3 observability includes:

- Real-time CI/CD health dashboard
- Failure analytics and error tracking
- Slack/Discord alerts for failures and SLO breaches
- SLO tracking with burn rate calculations
- Automated dashboard generation
- Alerting workflows with escalation policies

## Components

### 1. Metrics Collection (`send-ci-metrics.mjs`)

Sends CI/CD pipeline metrics to SigNoz via OTLP HTTP API.

**Usage:**

```bash
node scripts/observability/send-ci-metrics.mjs <metrics-file>
```

**Metrics collected:**

- Pipeline success rates
- Job execution durations
- Test coverage percentages
- Build artifact counts

### 2. Dashboard Generation (`generate-dashboard.mjs`)

Generates Grafana dashboards programmatically from templates.

**Usage:**

```bash
node scripts/observability/generate-dashboard.mjs <template> <output-file>
```

**Available templates:**

- `ci-cd-health`: CI/CD pipeline health monitoring
- `application-health`: Application performance monitoring
- `performance-monitoring`: Detailed performance metrics and Lighthouse scores
- `application-overview`: High-level application health and key metrics
- `error-monitoring`: Error tracking and failure analysis
- `database-monitoring`: Database performance and connection monitoring

### 3. Alerting Configuration Generation (`generate-alerts.mjs`)

Generates Prometheus alerting rules, Alertmanager configuration, and Docker Compose setup for the monitoring stack.

**Usage:**

```bash
node scripts/observability/generate-alerts.mjs [output-directory]
```

**Generated files:**

- `prometheus-rules.yml`: Prometheus alerting rules
- `alertmanager.yml`: Alertmanager notification configuration
- `docker-compose.monitoring.yml`: Complete monitoring stack (Prometheus, Alertmanager, Grafana, Node Exporter)

### 4. SigNoz Integration (`signoz.sh`)

Helper script to manage the SigNoz observability stack.

**Usage:**

```bash
scripts/observability/signoz.sh <up|down|logs>
```

## Configuration Files

### Prometheus Configuration

- `prometheus.yml`: Main Prometheus configuration with scrape targets
- `alert_rules.yml`: Alerting rules for CI/CD and application monitoring
- `slo_rules.yml`: SLO definitions and burn rate calculations

### Alertmanager Configuration

- `alertmanager.yml`: Alert routing and notification configuration for Slack/Discord

### Grafana Dashboards

- `ci-cd-health.json`: Pre-configured CI/CD health dashboard

## Setup Instructions

### 1. Start SigNoz Stack

```bash
scripts/observability/signoz.sh up
```

### 2. Configure Environment Variables

Set the following secrets in your CI/CD environment:

- `SIGNOZ_OTLP_ENDPOINT`: SigNoz OTLP endpoint (default: http://localhost:4318/v1/metrics)
- `SLACK_WEBHOOK_URL`: Slack webhook URL for alerts
- `DISCORD_WEBHOOK_URL`: Discord webhook URL for alerts

### 3. Deploy Monitoring Stack

```bash
# Deploy to Kubernetes
kubectl apply -f apps/infrastructure/kubernetes/monitoring/
```

### 4. Generate Custom Dashboards

```bash
node scripts/observability/generate-dashboard.mjs ci-cd-health dashboards/custom-ci-cd.json
```

## SLO Monitoring

### CI/CD Pipeline SLOs

- **Target**: 95% success rate over 30 days
- **Burn Rate Calculation**: Tracks error budget consumption
- **Alert Thresholds**:
  - Warning: Burn rate > 5.76 (6h window)
  - Critical: Burn rate > 14.4 (1h window)

### Burn Rate Formula

```
Burn Rate = (1 - Actual Success Rate) / (1 - SLO Target)
```

## Alerting Workflows

### Escalation Policies

1. **Immediate Alerts**: Critical failures (pipeline failures, application downtime)
2. **Warning Alerts**: Performance degradation, SLO breaches
3. **Info Alerts**: Routine notifications and insights

### Notification Channels

- **Slack**: Real-time alerts with detailed context
- **Discord**: Alternative notification channel
- **Email**: Backup notification method

## Monitoring Capabilities

### Real-time Dashboards

- Pipeline success rates and trends
- Job execution times and failure patterns
- Test coverage and quality metrics
- SLO compliance and error budget tracking

### Failure Analytics

- Detailed error tracking with context
- Failure pattern analysis
- Root cause identification
- Automated incident response

### Actionable Insights

- Performance optimization recommendations
- Quality improvement suggestions
- Infrastructure capacity planning
- Risk assessment and mitigation strategies

## Integration Points

### CI/CD Pipeline Integration

- Automatic metrics collection on pipeline completion
- Real-time alerting for failures
- SLO tracking and reporting
- Performance benchmarking

### Application Integration

- Health check monitoring
- Performance metrics collection
- Error rate tracking
- User experience monitoring

## Troubleshooting

### Common Issues

1. **Metrics not appearing**: Check SigNoz endpoint connectivity
2. **Alerts not firing**: Verify Prometheus rules and Alertmanager configuration
3. **Dashboard errors**: Ensure Grafana data sources are properly configured

### Debug Commands

```bash
# Check SigNoz logs
scripts/observability/signoz.sh logs

# Test metrics endpoint
curl -X POST http://localhost:4318/v1/metrics \
  -H "Content-Type: application/json" \
  -d @test-metrics.json

# Validate Prometheus rules
promtool check rules apps/infrastructure/kubernetes/monitoring/prometheus/slo_rules.yml
```

## Security Considerations

- OTLP endpoints should use HTTPS in production
- Alertmanager webhooks should be secured
- Grafana dashboards should have appropriate access controls
- Metrics data should be encrypted at rest and in transit

## Performance Optimization

- Use appropriate scrape intervals (30s for critical metrics, 5m for trends)
- Implement metric aggregation to reduce storage requirements
- Set up data retention policies for historical data
- Use sampling for high-volume metrics when appropriate
