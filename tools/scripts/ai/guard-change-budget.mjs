#!/usr/bin/env node
import { execFileSync } from 'child_process';
import fs from 'fs';

export function isValidGitRef(ref) {
  return /^[a-zA-Z0-9/_.-]+$/.test(ref);
}

function run(cmd, args = []) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      args[k] = v || true;
    }
  }
  return args;
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
export function filterChangedFiles(fileList, excluded) {
  return fileList.filter(Boolean).filter(f => !excluded.includes(f));
}

export function parseDiffNumstat(numstatText, excluded) {
  let added = 0;
  let deleted = 0;
  if (!numstatText) return { added, deleted };
  for (const line of numstatText.split('\n')) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const file = parts[2];
    if (excluded.includes(file)) continue;
    const a = parts[0] === '-' ? 0 : parseInt(parts[0], 10) || 0;
    const d = parts[1] === '-' ? 0 : parseInt(parts[1], 10) || 0;
    added += a;
    deleted += d;
  }
  return { added, deleted };
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

export function runGuard(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const mode = (args.mode || process.env.MODE || 'safe').toLowerCase();
  const base = args.base || process.env.BASE_REF || 'origin/main';

  console.log(`guard-change-budget: mode=${mode} base=${base}`);

  // Validate base parameter to prevent injection
  if (!isValidGitRef(base)) {
    console.error(`Invalid base ref: ${base}`);
    return 1;
  }

  // Ensure base exists (try to fetch minimal)
  try {
    run('git', ['rev-parse', '--verify', base]) ||
      run('git', ['fetch', 'origin', base, '--depth=1']);
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
    return 0;
  }

  const changedFiles = filterChangedFiles(diffNameOnly.split('\n'), EXCLUDED_FILES);
  const diffTotals = parseDiffNumstat(diffNumstat, EXCLUDED_FILES);
  const totalChangedLines = diffTotals.added + diffTotals.deleted;
  const totalFilesChanged = changedFiles.length;

  console.log(
    `Files changed: ${totalFilesChanged}, Lines changed (added+deleted): ${totalChangedLines}`
  );

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
  return 0;
}

if (process.argv[1] && new URL(process.argv[1], 'file:').href === import.meta.url) {
  const exitCode = runGuard();
  process.exit(typeof exitCode === 'number' ? exitCode : 0);
}
