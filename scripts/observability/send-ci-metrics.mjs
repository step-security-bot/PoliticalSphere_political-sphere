#!/usr/bin/env node

/**
 * Send CI/CD metrics to SigNoz via OTLP HTTP
 * Usage: node scripts/observability/send-ci-metrics.mjs <metrics-file>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SIGNOZ_OTLP_ENDPOINT = process.env.SIGNOZ_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics';
const CI_RUN_ID = process.env.GITHUB_RUN_ID;
const CI_RUN_NUMBER = process.env.GITHUB_RUN_NUMBER;
const REPO_NAME = process.env.GITHUB_REPOSITORY;
const BRANCH = process.env.GITHUB_REF_NAME;
const SHA = process.env.GITHUB_SHA;
const EVENT_NAME = process.env.GITHUB_EVENT_NAME;

async function sendMetrics(metricsFile) {
  if (!fs.existsSync(metricsFile)) {
    console.error(`Metrics file not found: ${metricsFile}`);
    process.exit(1);
  }

  const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));

  // Transform CI metrics to OTLP format
  const otlpMetrics = {
    resourceMetrics: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'ci-pipeline' } },
            { key: 'service.version', value: { stringValue: '1.0.0' } },
            { key: 'ci.run_id', value: { stringValue: CI_RUN_ID } },
            { key: 'ci.run_number', value: { stringValue: CI_RUN_NUMBER } },
            { key: 'ci.repository', value: { stringValue: REPO_NAME } },
            { key: 'ci.branch', value: { stringValue: BRANCH } },
            { key: 'ci.sha', value: { stringValue: SHA } },
            { key: 'ci.event', value: { stringValue: EVENT_NAME } },
          ],
        },
        scopeMetrics: [
          {
            metrics: [
              // Pipeline success rate
              {
                name: 'ci_pipeline_success_total',
                description: 'Total number of CI pipeline runs',
                unit: '1',
                gauge: {
                  dataPoints: [
                    {
                      attributes: [],
                      timeUnixNano: Date.now() * 1000000,
                      value: metrics.jobs ? Object.keys(metrics.jobs).length : 0,
                    },
                  ],
                },
              },
              // Job durations
              ...Object.entries(metrics.jobs || {}).map(([jobName, jobData]) => ({
                name: 'ci_job_duration_seconds',
                description: 'Duration of CI job execution',
                unit: 's',
                gauge: {
                  dataPoints: [
                    {
                      attributes: [
                        { key: 'job_name', value: { stringValue: jobName } },
                        {
                          key: 'job_result',
                          value: { stringValue: jobData.result || 'unknown' },
                        },
                      ],
                      timeUnixNano: Date.now() * 1000000,
                      value: jobData.duration_seconds || 0,
                    },
                  ],
                },
              })),
              // Test coverage
              {
                name: 'ci_test_coverage_percent',
                description: 'Test coverage percentage',
                unit: '%',
                gauge: {
                  dataPoints: [
                    {
                      attributes: [],
                      timeUnixNano: Date.now() * 1000000,
                      value: 80, // Placeholder - would be extracted from coverage reports
                    },
                  ],
                },
              },
              // Build artifacts count
              {
                name: 'ci_build_artifacts_count',
                description: 'Number of build artifacts generated',
                unit: '1',
                gauge: {
                  dataPoints: [
                    {
                      attributes: [],
                      timeUnixNano: Date.now() * 1000000,
                      value: 5, // Placeholder - would be counted from build output
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(SIGNOZ_OTLP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(otlpMetrics),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ CI metrics sent to SigNoz successfully');
  } catch (error) {
    console.error('❌ Failed to send metrics to SigNoz:', error.message);
    // Don't fail the CI for monitoring issues
    process.exit(0);
  }
}

const metricsFile = process.argv[2];
if (!metricsFile) {
  console.error('Usage: node scripts/observability/send-ci-metrics.mjs <metrics-file>');
  process.exit(1);
}

sendMetrics(metricsFile);
