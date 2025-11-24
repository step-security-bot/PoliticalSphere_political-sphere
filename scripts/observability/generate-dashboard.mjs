#!/usr/bin/env node

/**
 * Generate Grafana dashboards for observability
 * Usage: node scripts/observability/generate-dashboard.mjs <dashboard-type> <output-file>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dashboardTemplates = {
  'ci-cd-health': {
    title: 'CI/CD Health Dashboard',
    description: 'Real-time monitoring of CI/CD pipeline health and performance',
    panels: [
      {
        id: 1,
        title: 'Pipeline Success Rate (Last 24h)',
        type: 'stat',
        targets: [
          {
            expr: 'sum(rate(ci_pipeline_success_total[24h])) / sum(rate(ci_pipeline_runs_total[24h]))',
            legendFormat: 'Success Rate',
          },
        ],
        fieldConfig: {
          defaults: {
            unit: 'percentunit',
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: 'red', value: null },
                { color: 'orange', value: 0.95 },
                { color: 'green', value: 0.99 },
              ],
            },
          },
        },
      },
      {
        id: 2,
        title: 'Job Execution Times',
        type: 'graph',
        targets: [
          {
            expr: 'ci_job_duration_seconds{job_result="success"}',
            legendFormat: '{{job_name}}',
          },
        ],
        yAxes: [{ unit: 'seconds', label: 'Duration' }],
      },
      {
        id: 3,
        title: 'Test Coverage Trend',
        type: 'graph',
        targets: [
          {
            expr: 'ci_test_coverage_percent',
            legendFormat: 'Coverage %',
          },
        ],
        yAxes: [{ unit: 'percent', label: 'Coverage' }],
      },
      {
        id: 4,
        title: 'SLO Burn Rate',
        type: 'graph',
        targets: [
          {
            expr: 'ci_pipeline_slo_burn_rate_1h',
            legendFormat: '1h Burn Rate',
          },
          {
            expr: 'ci_pipeline_slo_burn_rate_6h',
            legendFormat: '6h Burn Rate',
          },
        ],
        thresholds: [
          { value: 1, color: 'green' },
          { value: 5.76, color: 'orange' },
          { value: 14.4, color: 'red' },
        ],
      },
      {
        id: 5,
        title: 'Recent Failures',
        type: 'table',
        targets: [
          {
            expr: 'ci_job_duration_seconds{job_result="failure"}',
            legendFormat: 'Failed Jobs',
          },
        ],
        transformations: [
          {
            id: 'organize',
            options: {
              excludeByName: {
                __name__: true,
                job: true,
              },
            },
          },
        ],
      },
      {
        id: 6,
        title: 'Actionable Insights',
        type: 'text',
        content: `
## 🔍 Actionable Insights

### Pipeline Health
- **Success Rate**: Monitor the overall pipeline success rate. Target: >99%
- **Job Durations**: Identify slow jobs that may need optimization
- **Test Coverage**: Ensure coverage stays above 80%

### SLO Monitoring
- **Burn Rate**: Keep burn rate below 1 for healthy SLO compliance
- **Error Budget**: Track remaining error budget for the month

### Recommendations
- Jobs running >30min should be investigated
- Test coverage drops indicate potential quality issues
- High failure rates may indicate infrastructure problems

### Quick Actions
- [View Failed Jobs](#) | [Check Logs](#) | [Restart Pipeline](#)
        `,
        mode: 'markdown',
      },
    ],
  },

  'application-health': {
    title: 'Application Health Dashboard',
    description: 'Monitor application performance and reliability',
    panels: [
      {
        id: 1,
        title: 'Application Uptime',
        type: 'stat',
        targets: [
          {
            expr: 'up',
            legendFormat: 'Uptime',
          },
        ],
      },
      {
        id: 2,
        title: 'Response Time',
        type: 'graph',
        targets: [
          {
            expr: 'http_request_duration_seconds{quantile="0.95"}',
            legendFormat: '95th percentile',
          },
        ],
      },
      {
        id: 3,
        title: 'Error Rate',
        type: 'graph',
        targets: [
          {
            expr: 'rate(http_requests_total{status=~"5.."}[5m])',
            legendFormat: '5xx errors',
          },
        ],
      },
    ],
  },

  'performance-monitoring': {
    title: 'Performance Monitoring Dashboard',
    description: 'Monitor application performance metrics, Lighthouse scores, and resource usage',
    panels: [
      {
        id: 1,
        title: 'Lighthouse Performance Score',
        type: 'stat',
        targets: [
          {
            expr: 'lighthouse_performance_score',
            legendFormat: 'Performance Score',
          },
        ],
        fieldConfig: {
          defaults: {
            unit: 'percent',
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: 'red', value: null },
                { color: 'orange', value: 85 },
                { color: 'green', value: 90 },
              ],
            },
          },
        },
      },
      {
        id: 2,
        title: 'Lighthouse Accessibility Score',
        type: 'stat',
        targets: [
          {
            expr: 'lighthouse_accessibility_score',
            legendFormat: 'Accessibility Score',
          },
        ],
        fieldConfig: {
          defaults: {
            unit: 'percent',
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: 'red', value: null },
                { color: 'green', value: 100 },
              ],
            },
          },
        },
      },
      {
        id: 3,
        title: 'Core Web Vitals',
        type: 'graph',
        targets: [
          {
            expr: 'lighthouse_lcp_seconds',
            legendFormat: 'Largest Contentful Paint',
          },
          {
            expr: 'lighthouse_fid_seconds',
            legendFormat: 'First Input Delay',
          },
          {
            expr: 'lighthouse_cls_score',
            legendFormat: 'Cumulative Layout Shift',
          },
        ],
      },
      {
        id: 4,
        title: 'Application Response Times',
        type: 'graph',
        targets: [
          {
            expr: 'http_request_duration_seconds{quantile="0.95"}',
            legendFormat: '95th percentile',
          },
          {
            expr: 'http_request_duration_seconds{quantile="0.50"}',
            legendFormat: 'Median',
          },
        ],
      },
      {
        id: 5,
        title: 'Resource Usage Trends',
        type: 'graph',
        targets: [
          {
            expr: 'process_resident_memory_bytes',
            legendFormat: 'Memory Usage',
          },
          {
            expr: 'rate(process_cpu_user_seconds_total[5m])',
            legendFormat: 'CPU Usage',
          },
        ],
      },
      {
        id: 6,
        title: 'Performance Budget Violations',
        type: 'table',
        targets: [
          {
            expr: 'lighthouse_budget_violations_total',
            legendFormat: 'Budget Violations',
          },
        ],
      },
    ],
  },

  'application-overview': {
    title: 'Application Overview Dashboard',
    description: 'High-level overview of application health, performance, and key metrics',
    panels: [
      {
        id: 1,
        title: 'Application Uptime',
        type: 'stat',
        targets: [
          {
            expr: 'up{job="political-sphere-api"}',
            legendFormat: 'Uptime',
          },
        ],
        fieldConfig: {
          defaults: {
            unit: 'percentunit',
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: 'red', value: null },
                { color: 'green', value: 1 },
              ],
            },
          },
        },
      },
      {
        id: 2,
        title: 'Request Rate',
        type: 'stat',
        targets: [
          {
            expr: 'rate(political_sphere_api_http_requests_total[5m])',
            legendFormat: 'Requests/sec',
          },
        ],
      },
      {
        id: 3,
        title: 'Error Rate',
        type: 'stat',
        targets: [
          {
            expr: 'rate(political_sphere_api_http_requests_total{status_code=~"5.."}[5m]) / rate(political_sphere_api_http_requests_total[5m])',
            legendFormat: 'Error Rate',
          },
        ],
        fieldConfig: {
          defaults: {
            unit: 'percentunit',
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: 'green', value: null },
                { color: 'orange', value: 0.05 },
                { color: 'red', value: 0.1 },
              ],
            },
          },
        },
      },
      {
        id: 4,
        title: '95th Percentile Response Time',
        type: 'stat',
        targets: [
          {
            expr: 'histogram_quantile(0.95, rate(political_sphere_api_http_request_duration_seconds_bucket[5m]))',
            legendFormat: '95th percentile',
          },
        ],
        fieldConfig: {
          defaults: {
            unit: 'seconds',
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: 'green', value: null },
                { color: 'orange', value: 2 },
                { color: 'red', value: 5 },
              ],
            },
          },
        },
      },
      {
        id: 5,
        title: 'HTTP Requests by Status',
        type: 'graph',
        targets: [
          {
            expr: 'rate(political_sphere_api_http_requests_total{status_code=~"2.."}[5m])',
            legendFormat: '2xx',
          },
          {
            expr: 'rate(political_sphere_api_http_requests_total{status_code=~"4.."}[5m])',
            legendFormat: '4xx',
          },
          {
            expr: 'rate(political_sphere_api_http_requests_total{status_code=~"5.."}[5m])',
            legendFormat: '5xx',
          },
        ],
      },
      {
        id: 6,
        title: 'Memory Usage',
        type: 'graph',
        targets: [
          {
            expr: 'political_sphere_api_memory_usage_bytes / 1024 / 1024',
            legendFormat: 'Memory Usage (MB)',
          },
        ],
        yAxes: [{ unit: 'MB', label: 'Memory' }],
      },
      {
        id: 7,
        title: 'Active Connections',
        type: 'stat',
        targets: [
          {
            expr: 'political_sphere_api_active_connections',
            legendFormat: 'Active Connections',
          },
        ],
      },
      {
        id: 8,
        title: 'Top Error Routes',
        type: 'table',
        targets: [
          {
            expr: 'topk(10, rate(political_sphere_api_http_requests_total{status_code=~"5.."}[5m]))',
            legendFormat: '{{ route }}',
          },
        ],
        transformations: [
          {
            id: 'organize',
            options: {
              excludeByName: {
                __name__: true,
                job: true,
                instance: true,
              },
            },
          },
        ],
      },
    ],
  },

  'error-monitoring': {
    title: 'Error Monitoring Dashboard',
    description: 'Monitor application errors, exceptions, and failure patterns',
    panels: [
      {
        id: 1,
        title: 'Total Errors (Last 24h)',
        type: 'stat',
        targets: [
          {
            expr: 'increase(political_sphere_api_business_logic_errors_total[24h])',
            legendFormat: 'Business Logic Errors',
          },
        ],
      },
      {
        id: 2,
        title: 'HTTP Error Rate Trend',
        type: 'graph',
        targets: [
          {
            expr: 'rate(political_sphere_api_http_requests_total{status_code=~"4.."}[5m])',
            legendFormat: '4xx errors',
          },
          {
            expr: 'rate(political_sphere_api_http_requests_total{status_code=~"5.."}[5m])',
            legendFormat: '5xx errors',
          },
        ],
      },
      {
        id: 3,
        title: 'Errors by Component',
        type: 'table',
        targets: [
          {
            expr: 'increase(political_sphere_api_business_logic_errors_total[1h])',
            legendFormat: '{{ component }}',
          },
        ],
      },
      {
        id: 4,
        title: 'External API Errors',
        type: 'graph',
        targets: [
          {
            expr: 'rate(political_sphere_api_external_api_errors_total[5m])',
            legendFormat: '{{ service }}',
          },
        ],
      },
      {
        id: 5,
        title: 'Error Rate by Route',
        type: 'table',
        targets: [
          {
            expr: 'rate(political_sphere_api_http_requests_total{status_code=~"5.."}[5m]) / rate(political_sphere_api_http_requests_total[5m])',
            legendFormat: '{{ route }}',
          },
        ],
        fieldConfig: {
          defaults: {
            unit: 'percentunit',
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: 'green', value: null },
                { color: 'orange', value: 0.05 },
                { color: 'red', value: 0.1 },
              ],
            },
          },
        },
      },
      {
        id: 6,
        title: 'Recent Error Spike Alert',
        type: 'alert',
        targets: [
          {
            expr: 'rate(political_sphere_api_business_logic_errors_total[5m]) > 5',
            legendFormat: 'Error spike detected',
          },
        ],
        thresholds: [{ value: 5, color: 'red' }],
      },
    ],
  },

  'database-monitoring': {
    title: 'Database Monitoring Dashboard',
    description: 'Monitor database performance, connections, and query metrics',
    panels: [
      {
        id: 1,
        title: 'Active Database Connections',
        type: 'stat',
        targets: [
          {
            expr: 'political_sphere_database_connections_active',
            legendFormat: 'Active Connections',
          },
        ],
      },
      {
        id: 2,
        title: 'Database Connection Pool Usage',
        type: 'gauge',
        targets: [
          {
            expr: 'political_sphere_database_connections_active / political_sphere_database_connections_max',
            legendFormat: 'Pool Usage %',
          },
        ],
        fieldConfig: {
          defaults: {
            unit: 'percentunit',
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: 'green', value: null },
                { color: 'orange', value: 0.8 },
                { color: 'red', value: 0.95 },
              ],
            },
          },
        },
      },
      {
        id: 3,
        title: 'Database Query Duration',
        type: 'graph',
        targets: [
          {
            expr: 'histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))',
            legendFormat: '95th percentile',
          },
          {
            expr: 'histogram_quantile(0.50, rate(database_query_duration_seconds_bucket[5m]))',
            legendFormat: 'Median',
          },
        ],
        yAxes: [{ unit: 'seconds', label: 'Duration' }],
      },
      {
        id: 4,
        title: 'Slow Queries',
        type: 'table',
        targets: [
          {
            expr: 'increase(database_query_duration_seconds_count{le="1"}[5m])',
            legendFormat: 'Queries > 1s',
          },
        ],
      },
      {
        id: 5,
        title: 'Database Errors',
        type: 'stat',
        targets: [
          {
            expr: 'rate(database_errors_total[5m])',
            legendFormat: 'Errors/min',
          },
        ],
      },
      {
        id: 6,
        title: 'Cache Hit Rate',
        type: 'stat',
        targets: [
          {
            expr: 'rate(political_sphere_cache_hits_total[5m]) / (rate(political_sphere_cache_hits_total[5m]) + rate(political_sphere_cache_misses_total[5m]))',
            legendFormat: 'Cache Hit Rate',
          },
        ],
        fieldConfig: {
          defaults: {
            unit: 'percentunit',
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: 'red', value: null },
                { color: 'orange', value: 0.8 },
                { color: 'green', value: 0.9 },
              ],
            },
          },
        },
      },
    ],
  },
};

function generateDashboard(templateName, outputFile) {
  const template = dashboardTemplates[templateName];
  if (!template) {
    console.error(`Unknown dashboard template: ${templateName}`);
    console.log('Available templates:', Object.keys(dashboardTemplates).join(', '));
    process.exit(1);
  }

  const dashboard = {
    dashboard: {
      id: null,
      title: template.title,
      description: template.description,
      tags: ['generated', 'observability', templateName],
      timezone: 'browser',
      panels: template.panels.map((panel, index) => ({
        ...panel,
        id: panel.id || index + 1,
        gridPos: {
          h: 8,
          w: 12,
          x: (index % 2) * 12,
          y: Math.floor(index / 2) * 8,
        },
      })),
      time: {
        from: 'now-1h',
        to: 'now',
      },
      timepicker: {},
      templating: {
        list: [],
      },
      annotations: {
        list: [],
      },
      refresh: '30s',
      schemaVersion: 27,
      version: 0,
      links: [],
    },
  };

  fs.writeFileSync(outputFile, JSON.stringify(dashboard, null, 2));
  console.log(`✅ Generated dashboard: ${outputFile}`);
}

const [, , templateName, outputFile] = process.argv;

if (!templateName || !outputFile) {
  console.error(
    'Usage: node scripts/observability/generate-dashboard.mjs <template> <output-file>'
  );
  console.log('Available templates:', Object.keys(dashboardTemplates).join(', '));
  process.exit(1);
}

generateDashboard(templateName, outputFile);
