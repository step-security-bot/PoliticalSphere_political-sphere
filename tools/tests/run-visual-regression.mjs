#!/usr/bin/env node

/**
 * Visual Regression Runner (Playwright)
 *
 * Best-practice: delegate visual diffing to Playwright and persist a concise
 * JSON summary for dashboards or later analysis.
 *
 * Usage:
 *   node tools/tests/run-visual-regression.mjs
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const RESULTS_DIR = resolve(ROOT, 'ai-learning');
const RESULTS_FILE = resolve(RESULTS_DIR, 'ui-test-results.json');

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function readJsonArraySafe(file) {
  try {
    const txt = await readFile(file, 'utf8');
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function runPlaywrightJson() {
  return new Promise((resolvePromise, rejectPromise) => {
    const args = ['test', '-c', 'playwright-visual.config.ts', '--reporter=json'];
    const child = spawn('npx', ['playwright', ...args], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', d => {
      stdout += d.toString();
    });
    child.stderr.on('data', d => {
      stderr += d.toString();
    });

    child.on('close', code => {
      resolvePromise({ code, stdout, stderr });
    });

    child.on('error', err => rejectPromise(err));
  });
}

function summarizePlaywright(jsonReport) {
  // Playwright JSON reporter emits a top-level object with suites/tests
  // See: https://playwright.dev/docs/test-reporters#json-reporter
  const collect = { total: 0, passed: 0, failed: 0, skipped: 0 };
  const failures = [];

  function walkSuite(suite) {
    if (!suite) return;
    if (Array.isArray(suite.suites)) suite.suites.forEach(walkSuite);
    if (Array.isArray(suite.tests)) {
      for (const test of suite.tests) {
        collect.total += 1;
        const outcome = test.outcome || test.status || 'unknown';
        if (outcome === 'expected' || outcome === 'passed') collect.passed += 1;
        else if (outcome === 'skipped') collect.skipped += 1;
        else {
          collect.failed += 1;
          failures.push({
            title: test.title,
            location: test.location,
            outcome,
            error: test.errors?.[0]?.message || test.error?.message || null,
          });
        }
      }
    }
  }

  if (Array.isArray(jsonReport.suites)) {
    jsonReport.suites.forEach(walkSuite);
  } else if (jsonReport.suite) {
    walkSuite(jsonReport.suite);
  }

  const successRate = collect.total > 0 ? (collect.passed / collect.total) * 100 : 100;
  return { collect, failures, successRate };
}

async function main() {
  await ensureDir(RESULTS_DIR);

  const { code, stdout, stderr } = await runPlaywrightJson();

  let report;
  try {
    report = JSON.parse(stdout || '{}');
  } catch {
    console.error('Failed to parse Playwright JSON output');
    if (stderr) console.error(stderr);
    process.exitCode = code || 1;
    return;
  }

  const { collect, failures, successRate } = summarizePlaywright(report);

  const entry = {
    timestamp: new Date().toISOString(),
    summary: {
      total: collect.total,
      passed: collect.passed,
      failed: collect.failed,
      skipped: collect.skipped,
      successRate,
    },
    failures,
  };

  const history = await readJsonArraySafe(RESULTS_FILE);
  history.push(entry);
  await writeFile(RESULTS_FILE, JSON.stringify(history, null, 2));

  // Console summary
  console.log('📋 Visual Regression Summary');
  console.log(`  Total:   ${collect.total}`);
  console.log(`  Passed:  ${collect.passed}`);
  console.log(`  Failed:  ${collect.failed}`);
  console.log(`  Skipped: ${collect.skipped}`);
  console.log(`  Success: ${successRate.toFixed(1)}%`);

  // Propagate failure if tests failed
  if (collect.failed > 0 || (typeof code === 'number' && code !== 0)) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('Visual regression runner failed:', err);
  process.exit(1);
});
