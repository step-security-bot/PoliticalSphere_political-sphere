#!/usr/bin/env node
import { execFileSync } from 'child_process';
import fs from 'fs';

function run(cmd, args = []) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function parseArgs() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      args[k] = v || true;
    }
  }
  return args;
}

const args = parseArgs();
const mode = (args.mode || process.env.MODE || 'safe').toLowerCase();
const base = args.base || process.env.BASE_REF || 'origin/main';

console.log(`guard-change-budget: mode=${mode} base=${base}`);

// Validate base parameter to prevent injection
if (!/^[a-zA-Z0-9/_.-]+$/.test(base)) {
  console.error(`Invalid base ref: ${base}`);
  process.exit(1);
}

// Ensure base exists (try to fetch minimal)
try {
  run('git', ['rev-parse', '--verify', base]) || run('git', ['fetch', 'origin', base, '--depth=1']);
} catch {
  // ignore
}

// Validation protocol reminders
console.log('\nValidation Protocol Reminders:');
console.log('- Run unit tests, linters, and secret scan according to the Execution Mode.');
console.log('- Update CHANGELOG.md and TODO.md for all changes.');
console.log(
  '- Ensure parity between .blackboxrules and .github/copilot-instructions/copilot-instructions.md'
);
console.log('- Test changes in CI pipeline.');
console.log('- Gather feedback from development team.');
console.log('\nArtefact Checklist:');
console.log('- Attach or update SBOM/provenance artefacts for the change.');
console.log('- Capture test evidence (logs, screenshots, reports) when deferring gates.');
console.log('\nBenchmark Mapping Reminders:');
console.log(
  '- Map changes to OWASP ASVS, NIST SP 800-53, ISO/IEC 27001, WCAG 2.2 AA+, NIST AI RMF, and GDPR/CCPA as applicable.'
);
console.log('\nTelemetry Identifiers:');
console.log(
  '- Ensure automation outputs include trace or telemetry identifiers per governance playbook 2.2.0.'
);
console.log('');

const diffNumstat = run('git', ['diff', '--numstat', `${base}...HEAD`]);
const diffNameOnly = run('git', ['diff', '--name-only', `${base}...HEAD`]);

if (!diffNameOnly) {
  console.log('No changes detected between base and HEAD — nothing to check.');
  process.exit(0);
}

// Exclude generated files from budget calculation
const EXCLUDED_FILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'ai-index/codebase-index.json',
  'ai-cache/context-cache.json',
  'ai-cache/context-analytics.json',
  'ai-metrics/stats.json',
];
const changedFiles = diffNameOnly
  .split('\n')
  .filter(Boolean)
  .filter(f => !EXCLUDED_FILES.includes(f));

let totalAdded = 0;
let totalDeleted = 0;
if (diffNumstat) {
  for (const line of diffNumstat.split('\n')) {
    const parts = line.split('\t');
    if (parts.length >= 3) {
      const file = parts[2];
      // Skip excluded files in line count
      if (EXCLUDED_FILES.includes(file)) {
        continue;
      }
      const added = parts[0] === '-' ? 0 : parseInt(parts[0], 10) || 0;
      const deleted = parts[1] === '-' ? 0 : parseInt(parts[1], 10) || 0;
      totalAdded += added;
      totalDeleted += deleted;
    }
  }
}
const totalChangedLines = totalAdded + totalDeleted;
const totalFilesChanged = changedFiles.length;

console.log(
  `Files changed: ${totalFilesChanged}, Lines changed (added+deleted): ${totalChangedLines}`
);

function fail(msg) {
  console.error('\nGUARD FAILED: ' + msg + '\n');
  process.exit(1);
}

function pass(msg) {
  console.log('\nGUARD PASS: ' + msg + '\n');
}

// Helper: detect added dependencies in package.json
function detectNewDeps(baseRef) {
  try {
    // Validate baseRef to prevent injection
    if (!/^[a-zA-Z0-9/_.-]+$/.test(baseRef)) {
      console.error(`Invalid base ref: ${baseRef}`);
      return [];
    }
    const basePkg = run('git', ['show', `${baseRef}:package.json`]);
    const headPkg = fs.readFileSync('package.json', 'utf8');
    const baseJson = JSON.parse(basePkg || '{}');
    const headJson = JSON.parse(headPkg || '{}');
    // Use object spread to construct dependency maps explicitly and avoid
    // passing potentially unvalidated objects into Object.assign; spread
    // creates a shallow copy safely.
    const depsBase = {
      ...(baseJson.dependencies || {}),
      ...(baseJson.devDependencies || {}),
    };
    const depsHead = {
      ...(headJson.dependencies || {}),
      ...(headJson.devDependencies || {}),
    };
    const newDeps = [];
    for (const k of Object.keys(depsHead)) {
      if (!depsBase[k]) newDeps.push(k);
    }
    return newDeps;
  } catch {
    // If we can't read base package.json, be conservative and return []
    return [];
  }
}

// Helper: check docs/TODO.md for deferral entry
function checkTodoDeferral() {
  try {
    const todo = fs.readFileSync('docs/TODO.md', 'utf8');
    // Look for 'defer' or 'deferred' and an owner indicator (@ or Owner:) and a due date YYYY-MM-DD
    const deferPattern = /defer|deferred|deferral/i;
    const ownerPattern = /@\w+|Owner:\s*\S+/i;
    const datePattern = /\d{4}-\d{2}-\d{2}/;
    const hasDefer = deferPattern.test(todo) && ownerPattern.test(todo) && datePattern.test(todo);
    return hasDefer;
  } catch {
    return false;
  }
}

// Helper: check for SBOM/provenance/test evidence in changed files or repo
function checkAuditArtefacts() {
  const artPatterns = [/sbom/i, /provenance/i, /sbom\.json/i, /provenance\.json/i, /artifacts\//i];
  const evidencePatterns = [
    /test-results/i,
    /screenshots?/i,
    /test-logs/i,
    /playwright-report/i,
    /cypress/i,
  ];
  for (const f of changedFiles) {
    for (const p of artPatterns) if (p.test(f)) return { artefactFound: true };
    for (const p of evidencePatterns)
      if (p.test(f)) return { artefactFound: true, evidenceFound: true };
  }
  // look in repo for common artefact files
  const candidates = [
    'sbom.json',
    'provenance.json',
    'artifacts/sbom.json',
    'test-results',
    'screenshots',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return { artefactFound: true };
    }
  }
  return { artefactFound: false };
}

// Advisory mode - provide metrics but don't block
// This script is kept for informational purposes and local development guidance
console.log('\n========================================');
console.log('CHANGE METRICS (ADVISORY ONLY)');
console.log('========================================');
console.log(`Files: ${totalFilesChanged}`);
console.log(`Lines: ${totalChangedLines}`);
console.log('');

// Informational thresholds (not enforced)
const ADVISORY_LINE_THRESHOLD = 300;
const ADVISORY_FILE_THRESHOLD = 12;

if (totalChangedLines > ADVISORY_LINE_THRESHOLD || totalFilesChanged > ADVISORY_FILE_THRESHOLD) {
  console.log('ℹ️  LARGE CHANGE DETECTED');
  console.log(`   Lines: ${totalChangedLines} (advisory threshold: ${ADVISORY_LINE_THRESHOLD})`);
  console.log(`   Files: ${totalFilesChanged} (advisory threshold: ${ADVISORY_FILE_THRESHOLD})`);
  console.log('');
  console.log('   Consider:');
  console.log('   • Reviewing changes in smaller chunks');
  console.log('   • Ensuring comprehensive test coverage');
  console.log('   • Documenting major architectural changes in ADRs');
  console.log('');
}

// Check for new dependencies (advisory)
const newDeps = detectNewDeps(base);
if (newDeps.length > 0) {
  const hasADR = changedFiles.some(f => /adr|docs\/architecture/i.test(f));
  if (!hasADR) {
    console.log('ℹ️  NEW DEPENDENCIES DETECTED');
    console.log(`   Added: ${newDeps.join(', ')}`);
    console.log('   Consider documenting significant dependencies in an ADR');
    console.log('');
  }
}

console.log('✅ METRICS COLLECTED');
console.log('========================================\n');
process.exit(0);
