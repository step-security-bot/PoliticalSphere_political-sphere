#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const budgetsPath = path.resolve('config/performance-budgets.json');
if (!fs.existsSync(budgetsPath)) {
  console.error('[perf-enforce] Missing performance budgets file:', budgetsPath);
  process.exit(1);
}

const budgets = JSON.parse(fs.readFileSync(budgetsPath, 'utf8'));
// Expected shape example:
// { "apiLatencyP95": 200, "apiLatencyP99": 500, "frontendFCP": 1500 }

const resultsPath = path.resolve('artifacts/performance/current-metrics.json');
if (!fs.existsSync(resultsPath)) {
  console.warn('[perf-enforce] No current metrics file found, skipping enforcement (pass).');
  process.exit(0);
}
const metrics = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

let violations = [];
for (const [key, limit] of Object.entries(budgets)) {
  const value = metrics[key];
  if (typeof value === 'number' && value > limit) {
    violations.push({ key, value, limit });
  }
}

if (violations.length) {
  console.error('[perf-enforce] Performance budget violations detected:');
  for (const v of violations) {
    console.error(` - ${v.key}: value=${v.value} limit=${v.limit}`);
  }
  process.exit(1);
}

console.log('[perf-enforce] All performance budgets satisfied.');
