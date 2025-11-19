#!/usr/bin/env node
import { readFileSync } from 'node:fs';

function fail(msg) {
  console.log(`::error::${msg}`);
  process.exit(1);
}

// Expect k6 JSON summary path via SUMMARY_JSON and budgets via BUDGETS_JSON
const summaryPath = process.env.SUMMARY_JSON || 'artifacts/k6-summary.json';
const budgetsPath = process.env.BUDGETS_JSON || 'config/performance-budgets.json';
const serviceType = process.env.SERVICE_TYPE || 'api';

const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const allBudgets = JSON.parse(readFileSync(budgetsPath, 'utf8'));
const budgets = allBudgets[serviceType];

if (!budgets) {
  fail(`No budgets found for service type: ${serviceType}`);
}

// Extract p(95) from default HTTP req_duration
const p95 =
  summary.metrics?.http_req_duration?.percentiles?.['95'] ||
  summary.metrics?.http_req_duration?.p(95);
if (typeof p95 !== 'number') fail('k6 summary missing http_req_duration p95');

const maxP95 = budgets.latency?.p95_ms;
if (typeof maxP95 === 'number' && p95 > maxP95)
  fail(`Latency p95 ${p95}ms exceeds budget ${maxP95}ms`);

console.log(`Latency p95 ${p95}ms within budget ${maxP95}ms`);
