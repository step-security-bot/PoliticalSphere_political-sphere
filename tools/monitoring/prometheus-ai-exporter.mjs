#!/usr/bin/env node

/**
 * Prometheus Metrics Exporter for AI System
 *
 * Reads AI metrics from ai-metrics/stats.json and exposes them in Prometheus format
 * for Grafana dashboards to consume.
 *
 * Usage:
 *   node tools/monitoring/prometheus-ai-exporter.mjs [--port 9090]
 *
 * Metrics Exported:
 *   - ai_competence_score: Current AI code quality score (0-1)
 *   - ai_tool_execution_duration_seconds: Tool execution latency histogram
 *   - ai_cache_hits_total: Cache hit counter
 *   - ai_cache_misses_total: Cache miss counter
 *   - ai_workflow_success_total: Successful workflow runs
 *   - ai_workflow_total: Total workflow runs
 *   - ai_neutrality_violations_total: Political bias detections
 *   - ai_index_size_bytes: Size of code index
 *   - ai_index_file_count: Number of indexed files
 *   - ai_tool_errors_total: Tool error counter
 *   - ai_smoke_test_success_total: Passing smoke tests
 *   - ai_smoke_test_total: Total smoke tests run
 *   - ai_context_bundle_last_update_timestamp: Last context refresh time
 */

import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METRICS_FILE = path.join(__dirname, '../../ai-metrics/stats.json');
const PORT = process.env.PORT || 9090;

/**
 * Load AI metrics from stats.json
 */
async function loadMetrics() {
  try {
    const data = await fs.readFile(METRICS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`Failed to load metrics: ${error.message}`);
    return null;
  }
}

/**
 * Format metrics in Prometheus exposition format
 */
function formatPrometheusMetrics(metrics) {
  if (!metrics) {
    return '# No metrics available\n';
  }

  const lines = [];

  // Competence Score
  if (metrics.competence?.current !== undefined) {
    lines.push('# HELP ai_competence_score Current AI code quality score (0-1)');
    lines.push('# TYPE ai_competence_score gauge');
    lines.push(`ai_competence_score ${metrics.competence.current}`);
  }

  // Tool Latency (convert to histogram buckets)
  if (metrics.latency) {
    lines.push('# HELP ai_tool_execution_duration_seconds AI tool execution latency');
    lines.push('# TYPE ai_tool_execution_duration_seconds histogram');

    Object.entries(metrics.latency).forEach(([tool, latencyMs]) => {
      const latencySeconds = latencyMs / 1000;

      // Create histogram buckets (0.1s, 0.5s, 1s, 5s, +Inf)
      const buckets = [0.1, 0.5, 1, 5];
      let cumulativeCount = 0;

      buckets.forEach(bucket => {
        if (latencySeconds <= bucket) {
          cumulativeCount++;
        }
        lines.push(
          `ai_tool_execution_duration_seconds_bucket{tool="${tool}",le="${bucket}"} ${cumulativeCount}`
        );
      });

      lines.push(
        `ai_tool_execution_duration_seconds_bucket{tool="${tool}",le="+Inf"} ${cumulativeCount + 1}`
      );
      lines.push(`ai_tool_execution_duration_seconds_sum{tool="${tool}"} ${latencySeconds}`);
      lines.push(`ai_tool_execution_duration_seconds_count{tool="${tool}"} 1`);
    });
  }

  // Cache Metrics
  if (metrics.cache) {
    lines.push('# HELP ai_cache_hits_total Total AI cache hits');
    lines.push('# TYPE ai_cache_hits_total counter');
    lines.push(`ai_cache_hits_total ${metrics.cache.hits || 0}`);

    lines.push('# HELP ai_cache_misses_total Total AI cache misses');
    lines.push('# TYPE ai_cache_misses_total counter');
    lines.push(`ai_cache_misses_total ${metrics.cache.misses || 0}`);
  }

  // Workflow Success
  if (metrics.workflows) {
    lines.push('# HELP ai_workflow_success_total Successful AI workflow runs');
    lines.push('# TYPE ai_workflow_success_total counter');
    lines.push(`ai_workflow_success_total ${metrics.workflows.success || 0}`);

    lines.push('# HELP ai_workflow_total Total AI workflow runs');
    lines.push('# TYPE ai_workflow_total counter');
    lines.push(`ai_workflow_total ${metrics.workflows.total || 0}`);
  }

  // Neutrality Violations
  if (metrics.neutrality?.violations) {
    lines.push('# HELP ai_neutrality_violations_total Political bias detections');
    lines.push('# TYPE ai_neutrality_violations_total counter');

    Object.entries(metrics.neutrality.violations).forEach(([category, count]) => {
      lines.push(`ai_neutrality_violations_total{category="${category}"} ${count}`);
    });
  }

  // Index Size
  if (metrics.index) {
    lines.push('# HELP ai_index_size_bytes Size of AI code index');
    lines.push('# TYPE ai_index_size_bytes gauge');
    lines.push(`ai_index_size_bytes ${metrics.index.sizeBytes || 0}`);

    lines.push('# HELP ai_index_file_count Number of indexed files');
    lines.push('# TYPE ai_index_file_count gauge');
    lines.push(`ai_index_file_count ${metrics.index.fileCount || 0}`);
  }

  // Tool Errors
  if (metrics.errors) {
    lines.push('# HELP ai_tool_errors_total AI tool error counter');
    lines.push('# TYPE ai_tool_errors_total counter');

    Object.entries(metrics.errors).forEach(([tool, count]) => {
      lines.push(`ai_tool_errors_total{tool="${tool}"} ${count}`);
    });
  }

  // Smoke Test Results
  if (metrics.smokeTests) {
    lines.push('# HELP ai_smoke_test_success_total Passing smoke tests');
    lines.push('# TYPE ai_smoke_test_success_total counter');
    lines.push(`ai_smoke_test_success_total ${metrics.smokeTests.passed || 0}`);

    lines.push('# HELP ai_smoke_test_total Total smoke tests run');
    lines.push('# TYPE ai_smoke_test_total counter');
    lines.push(`ai_smoke_test_total ${metrics.smokeTests.total || 0}`);
  }

  // Context Bundle Freshness
  if (metrics.contextBundles?.lastUpdate) {
    lines.push('# HELP ai_context_bundle_last_update_timestamp Last context refresh time');
    lines.push('# TYPE ai_context_bundle_last_update_timestamp gauge');
    lines.push(
      `ai_context_bundle_last_update_timestamp ${Math.floor(new Date(metrics.contextBundles.lastUpdate).getTime() / 1000)}`
    );
  }

  return lines.join('\n') + '\n';
}

/**
 * HTTP server to expose metrics
 */
async function startServer() {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
      const metrics = await loadMetrics();
      const prometheusOutput = formatPrometheusMetrics(metrics);

      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
      res.end(prometheusOutput);
    } else if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(
        'Not Found\n\nEndpoints:\n  /metrics - Prometheus metrics\n  /health - Health check\n'
      );
    }
  });

  server.listen(PORT, () => {
    console.log(`✅ Prometheus AI Metrics Exporter running on http://localhost:${PORT}/metrics`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// Start server
startServer().catch(error => {
  console.error('Failed to start metrics exporter:', error);
  process.exit(1);
});
