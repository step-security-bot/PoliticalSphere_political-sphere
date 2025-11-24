#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

export async function runHealthCheck(options = {}) {
  const now = new Date();
  const {
    cacheDir = 'ai-metrics/stats.json',
    indexDir = 'ai-index/codebase-index.json',
    uiResults = 'ai-learning/ui-test-results.json',
    fastMode = false,
    quiet = false,
  } = options;

  function log(...args) {
    if (!quiet) console.log(...args);
  }

  function safeJson(p) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      return null;
    }
  }

  const stats = safeJson(path.resolve(cacheDir)) || {};
  const indexMeta = safeJson(path.resolve(indexDir)) || {};
  const uiTest = safeJson(path.resolve(uiResults)) || {};

  function ageHours(ts) {
    if (!ts) return null;
    try {
      return (now.getTime() - new Date(ts).getTime()) / 36e5;
    } catch {
      return null;
    }
  }

  const report = {
    generatedAt: now.toISOString(),
    cacheHitRate: stats.cacheHitRate ?? null,
    lastCacheRefreshAgeHours: ageHours(stats.lastRefresh),
    indexSize: Array.isArray(indexMeta.files) ? indexMeta.files.length : null,
    uiA11yFailures: uiTest.failures ?? null,
    uiA11yPassRate: uiTest.passRate ?? null,
    recommendations: [],
  };

  const failures = [];

  if ((report.cacheHitRate ?? 1) < 0.7) {
    report.recommendations.push('Cache hit rate below 70%: run ai:optimize');
    failures.push('Low cache hit rate');
  }
  if ((report.indexSize ?? 0) === 0) {
    report.recommendations.push('Index appears empty: run ai:index');
    failures.push('Empty index');
  }
  if ((report.uiA11yFailures ?? 0) > 0) {
    report.recommendations.push('Accessibility failures detected: review component semantics');
    failures.push('Accessibility failures');
  }

  // Optional fast-mode check: ensure files exist to avoid false positives
  if (fastMode) {
    const required = [cacheDir, indexDir];
    for (const f of required) {
      if (!fs.existsSync(path.resolve(f))) {
        failures.push(`Missing required file: ${f}`);
      }
    }
  }

  const ok = failures.length === 0;

  log(JSON.stringify({ ...report, ok, failures }, null, 2));
  return { ok, failures, report };
}

if (process.argv[1] && new URL(process.argv[1], 'file:').href === import.meta.url) {
  runHealthCheck().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
