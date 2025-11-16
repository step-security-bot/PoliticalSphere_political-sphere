#!/usr/bin/env node
/**
 * Pre-commit Hook: Political Neutrality
 *
 * Validates political neutrality before allowing commits.
 * Install with: ln -s ../../tools/scripts/ai/precommit-neutrality.mts .git/hooks/pre-commit
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function main() {
  console.log('\n🛡️  Running pre-commit political neutrality check...\n');

  try {
    // Get staged files
    const { stdout } = await execAsync('git diff --cached --name-only --diff-filter=ACM');
    const stagedFiles = stdout.trim().split('\n').filter(Boolean);

    if (stagedFiles.length === 0) {
      console.log('✅ No staged files to check\n');
      return;
    }

    // Run neutrality check on staged files
    const { default: ciCheck } = await import('./ci-neutrality-check.mts');
    await ciCheck(stagedFiles);

    console.log('✅ Pre-commit neutrality check passed\n');
  } catch (error) {
    console.error('\n❌ Pre-commit neutrality check FAILED');
    console.error('   Fix the issues above or use --no-verify to bypass (not recommended)\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
