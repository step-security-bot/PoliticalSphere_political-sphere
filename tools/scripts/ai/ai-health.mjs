#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function safeJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

const stats = safeJson(path.resolve('ai-metrics/stats.json')) || {};
const indexMeta = safeJson(path.resolve('ai-index/codebase-index.json')) || {};
const uiTest = safeJson(path.resolve('ai-learning/ui-test-results.json')) || {};

const now = new Date();

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

if ((report.cacheHitRate ?? 1) < 0.7) {
  report.recommendations.push('Cache hit rate below 70%: run ai:optimize');
}
if ((report.indexSize ?? 0) === 0) {
  report.recommendations.push('Index appears empty: run ai:index');
}
if ((report.uiA11yFailures ?? 0) > 0) {
  report.recommendations.push('Accessibility failures detected: review component semantics');
}

console.log(JSON.stringify(report, null, 2));
