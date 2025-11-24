#!/usr/bin/env node

/**
 * Collect Lighthouse CI metrics and expose them to Prometheus
 * Usage: node scripts/observability/collect-lighthouse-metrics.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { register, Gauge, collectDefaultMetrics } from 'prom-client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Prometheus metrics
collectDefaultMetrics();

// Lighthouse performance metrics
const lighthousePerformanceScore = new Gauge({
  name: 'lighthouse_performance_score',
  help: 'Lighthouse performance score (0-100)',
  labelNames: ['url'],
});

const lighthouseAccessibilityScore = new Gauge({
  name: 'lighthouse_accessibility_score',
  help: 'Lighthouse accessibility score (0-100)',
  labelNames: ['url'],
});

const lighthouseBestPracticesScore = new Gauge({
  name: 'lighthouse_best_practices_score',
  help: 'Lighthouse best practices score (0-100)',
  labelNames: ['url'],
});

const lighthouseSEOScore = new Gauge({
  name: 'lighthouse_seo_score',
  help: 'Lighthouse SEO score (0-100)',
  labelNames: ['url'],
});

// Core Web Vitals
const lighthouseLCPScores = new Gauge({
  name: 'lighthouse_lcp_seconds',
  help: 'Largest Contentful Paint in seconds',
  labelNames: ['url'],
});

const lighthouseFIDScore = new Gauge({
  name: 'lighthouse_fid_seconds',
  help: 'First Input Delay in seconds',
  labelNames: ['url'],
});

const lighthouseCLSScore = new Gauge({
  name: 'lighthouse_cls_score',
  help: 'Cumulative Layout Shift score',
  labelNames: ['url'],
});

// Performance budget metrics
const lighthouseBudgetViolations = new Gauge({
  name: 'lighthouse_budget_violations_total',
  help: 'Total number of performance budget violations',
  labelNames: ['url', 'resource_type'],
});

const lighthouseBudgetChecks = new Gauge({
  name: 'lighthouse_budget_checks_total',
  help: 'Total number of performance budget checks',
  labelNames: ['url', 'resource_type'],
});

async function collectLighthouseMetrics() {
  try {
    const lighthouseResultsPath = '.lighthouseci';

    if (!fs.existsSync(lighthouseResultsPath)) {
      console.log('No Lighthouse results found');
      return;
    }

    const manifestPath = path.join(lighthouseResultsPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.log('No Lighthouse manifest found');
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    for (const run of manifest) {
      if (!run.jsonPath || !fs.existsSync(run.jsonPath)) {
        continue;
      }

      const results = JSON.parse(fs.readFileSync(run.jsonPath, 'utf8'));
      const url = run.url || 'unknown';

      // Extract category scores
      const categories = results.categories;
      if (categories) {
        lighthousePerformanceScore.set(
          { url },
          Math.round((categories.performance?.score || 0) * 100)
        );
        lighthouseAccessibilityScore.set(
          { url },
          Math.round((categories.accessibility?.score || 0) * 100)
        );
        lighthouseBestPracticesScore.set(
          { url },
          Math.round((categories['best-practices']?.score || 0) * 100)
        );
        lighthouseSEOScore.set({ url }, Math.round((categories.seo?.score || 0) * 100));
      }

      // Extract Core Web Vitals
      const audits = results.audits;
      if (audits) {
        if (audits['largest-contentful-paint']) {
          const lcpValue = audits['largest-contentful-paint'].numericValue;
          lighthouseLCPScores.set({ url }, lcpValue ? lcpValue / 1000 : 0); // Convert to seconds
        }

        if (audits['max-potential-fid']) {
          const fidValue = audits['max-potential-fid'].numericValue;
          lighthouseFIDScore.set({ url }, fidValue ? fidValue / 1000 : 0); // Convert to seconds
        }

        if (audits['cumulative-layout-shift']) {
          lighthouseCLSScore.set({ url }, audits['cumulative-layout-shift'].numericValue || 0);
        }
      }
    }

    console.log('✅ Lighthouse metrics collected successfully');
  } catch (error) {
    console.error('❌ Error collecting Lighthouse metrics:', error.message);
  }
}

async function collectPerformanceBudgets() {
  try {
    const budgetsPath = 'config/performance-budgets.json';
    if (!fs.existsSync(budgetsPath)) {
      console.log('No performance budgets found');
      return;
    }

    const budgets = JSON.parse(fs.readFileSync(budgetsPath, 'utf8'));
    const lighthouseBudgets = budgets.web?.lighthouse;

    if (!lighthouseBudgets) {
      console.log('No Lighthouse budgets found');
      return;
    }

    // This would be populated by Lighthouse CI results
    // For now, we'll set baseline values
    const url = 'http://localhost:3000';

    // Reset counters
    lighthouseBudgetViolations.reset();
    lighthouseBudgetChecks.reset();

    // Example: Check resource sizes (would be populated by actual Lighthouse runs)
    if (lighthouseBudgets.resourceSizes) {
      for (const resource of lighthouseBudgets.resourceSizes) {
        lighthouseBudgetChecks.set({ url, resource_type: resource.resourceType }, 1);
        // In a real implementation, this would check actual vs budget
        lighthouseBudgetViolations.set({ url, resource_type: resource.resourceType }, 0);
      }
    }

    console.log('✅ Performance budget metrics collected successfully');
  } catch (error) {
    console.error('❌ Error collecting performance budget metrics:', error.message);
  }
}

// HTTP server to expose metrics
import http from 'node:http';

const server = http.createServer(async (req, res) => {
  if (req.url === '/metrics') {
    // Collect latest metrics
    await collectLighthouseMetrics();
    await collectPerformanceBudgets();

    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

const PORT = process.env.METRICS_PORT || 9464;

// Support a one-time collection mode via --once to avoid long-running server in local runs
const args = process.argv.slice(2);
const once = args.includes('--once');

if (once) {
  (async () => {
    await collectLighthouseMetrics();
    await collectPerformanceBudgets();
    console.log('📊 One-time Lighthouse metrics collected (exiting)');
    process.exit(0);
  })();
} else {
  server.listen(PORT, () => {
    console.log(`🚀 Metrics server listening on port ${PORT}`);
    console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down metrics server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down metrics server...');
  server.close(() => {
    process.exit(0);
  });
});
