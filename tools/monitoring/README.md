# AI System Monitoring

This directory contains monitoring and observability tools for the AI system.

## Components

### Grafana Dashboard

**File:** `grafana-dashboards/ai-system-metrics.json`

Production-ready Grafana dashboard displaying real-time AI system metrics:

- **Competence Score Trend**: Track AI code quality over time (target: >0.7)
- **Tool Execution Latency**: Monitor p95 latency for all AI tools (target: <500ms)
- **Cache Hit Rate**: AI cache effectiveness (target: >80%)
- **Workflow Success Rate**: AI maintenance workflow reliability (target: >98%)
- **Neutrality Violations**: Political bias detections by category (target: 0)
- **Index Size & Growth**: Code index size and file count trends
- **Top Tool Errors**: Most frequently failing AI tools (24h window)
- **Smoke Test Pass Rate**: Overall AI system health (target: 100%)
- **Context Bundle Freshness**: Age of AI context bundles (target: <24h)

**Import Dashboard:**

```bash
# Via Grafana API
curl -X POST \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @tools/monitoring/grafana-dashboards/ai-system-metrics.json \
  http://grafana.example.com/api/dashboards/db

# Via Grafana UI
1. Navigate to Dashboards → Import
2. Upload tools/monitoring/grafana-dashboards/ai-system-metrics.json
3. Select Prometheus datasource
4. Click Import
```

### Prometheus Metrics Exporter

**File:** `prometheus-ai-exporter.mjs`

HTTP server exposing AI metrics in Prometheus format for scraping.

**Metrics Exported:**

| Metric | Type | Description |
|--------|------|-------------|
| `ai_competence_score` | Gauge | Current AI code quality score (0-1) |
| `ai_tool_execution_duration_seconds` | Histogram | Tool execution latency distribution |
| `ai_cache_hits_total` | Counter | Total cache hits |
| `ai_cache_misses_total` | Counter | Total cache misses |
| `ai_workflow_success_total` | Counter | Successful workflow runs |
| `ai_workflow_total` | Counter | Total workflow runs |
| `ai_neutrality_violations_total` | Counter | Political bias detections by category |
| `ai_index_size_bytes` | Gauge | Size of code index |
| `ai_index_file_count` | Gauge | Number of indexed files |
| `ai_tool_errors_total` | Counter | Tool error count by tool name |
| `ai_smoke_test_success_total` | Counter | Passing smoke tests |
| `ai_smoke_test_total` | Counter | Total smoke tests run |
| `ai_context_bundle_last_update_timestamp` | Gauge | Last context refresh time (Unix timestamp) |

**Usage:**

```bash
# Start exporter (default port 9090)
node tools/monitoring/prometheus-ai-exporter.mjs

# Custom port
PORT=9100 node tools/monitoring/prometheus-ai-exporter.mjs

# Access metrics
curl http://localhost:9090/metrics

# Health check
curl http://localhost:9090/health
```

**Prometheus Configuration:**

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'ai-system'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 30s
    scrape_timeout: 10s
```

## Setup Instructions

### 1. Start Metrics Exporter

```bash
# Development
npm run monitoring:start

# Production (with PM2)
pm2 start tools/monitoring/prometheus-ai-exporter.mjs --name ai-metrics-exporter

# Docker
docker run -d \
  -p 9090:9090 \
  -v $(pwd)/ai-metrics:/app/ai-metrics:ro \
  --name ai-metrics-exporter \
  node:20-alpine \
  node /app/tools/monitoring/prometheus-ai-exporter.mjs
```

### 2. Configure Prometheus

```bash
# Add scrape target to prometheus.yml
scrape_configs:
  - job_name: 'ai-system'
    static_configs:
      - targets: ['ai-metrics-exporter:9090']

# Reload Prometheus config
curl -X POST http://prometheus:9090/-/reload
```

### 3. Import Grafana Dashboard

```bash
# Import dashboard JSON
curl -X POST \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @tools/monitoring/grafana-dashboards/ai-system-metrics.json \
  http://grafana:3000/api/dashboards/db
```

### 4. Configure Alerts

Add to Prometheus alerting rules:

```yaml
groups:
  - name: ai_system_alerts
    interval: 1m
    rules:
      - alert: AICompetenceScoreLow
        expr: ai_competence_score < 0.5
        for: 72h
        annotations:
          summary: "AI competence score below threshold"
          description: "Competence score has been below 0.5 for 3 days"
        
      - alert: AIWorkflowFailureRate
        expr: rate(ai_workflow_total[24h]) - rate(ai_workflow_success_total[24h]) > 0.02
        for: 1h
        annotations:
          summary: "AI workflow failure rate high"
          description: "More than 2% of workflows failing in 24h window"
        
      - alert: AINeutralityViolation
        expr: increase(ai_neutrality_violations_total[1h]) > 0
        for: 1m
        annotations:
          summary: "Political neutrality violation detected"
          description: "{{ $labels.category }} neutrality violation in last hour"
          severity: critical
        
      - alert: AIToolLatencyHigh
        expr: histogram_quantile(0.95, ai_tool_execution_duration_seconds_bucket) > 0.5
        for: 15m
        annotations:
          summary: "AI tool p95 latency exceeds 500ms"
          description: "{{ $labels.tool }} latency too high"
```

## Monitoring Best Practices

### Daily Health Checks

1. **Review Dashboard**: Check Grafana dashboard for anomalies
2. **Competence Score**: Ensure score >0.7, investigate if declining
3. **Workflow Success**: Verify >98% success rate in last 24h
4. **Neutrality Violations**: Immediate investigation if any violations detected

### Alert Response

**P0 - Immediate (Neutrality Violations):**

1. Review violation details in Prometheus
2. Identify affected code/commits
3. Escalate to TGC immediately
4. Roll back changes if needed
5. Document incident

**P1 - Same Day (Workflow Failures):**

1. Check workflow logs in GitHub Actions
2. Review error messages in metrics exporter
3. Fix root cause or create remediation ticket
4. Re-run failed workflows

**P2 - Weekly (Low Competence Score):**

1. Review competence history for trends
2. Identify code quality issues
3. Improve test coverage
4. Schedule refactoring work

### Metrics Retention

- **Prometheus**: 30 days raw metrics
- **Grafana**: 90 days aggregated metrics
- **Logs**: 7 days verbose, 90 days summarized

## Troubleshooting

### Exporter Not Starting

```bash
# Check metrics file exists
ls -la ai-metrics/stats.json

# Verify file permissions
chmod 644 ai-metrics/stats.json

# Check port availability
lsof -i :9090

# View logs
pm2 logs ai-metrics-exporter
```

### No Data in Grafana

```bash
# Verify Prometheus scraping
curl http://prometheus:9090/api/v1/targets | grep ai-system

# Check metrics endpoint
curl http://localhost:9090/metrics

# Verify Grafana datasource
curl http://grafana:3000/api/datasources | jq '.[] | select(.type=="prometheus")'
```

### Stale Metrics

```bash
# Force metrics update
npm run ai:refresh
node tools/scripts/ai/competence-monitor.cjs assess

# Restart exporter
pm2 restart ai-metrics-exporter
```

## Related Documentation

- **AI Governance:** `docs/07-ai-and-simulation/ai-governance.md`
- **AI Maintenance SOP:** `docs/05-engineering-and-devops/sops/ai-maintenance-sop.md`
- **AI System Usage:** `docs/05-engineering-and-devops/ai-system-usage-guide.md`

---

**Last Updated:** 2025-11-14  
**Owner:** DevOps Team
