#!/usr/bin/env node

/**
 * Generate Grafana dashboards for observability
 * Usage: node scripts/observability/generate-dashboard.mjs <dashboard-type> <output-file>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
