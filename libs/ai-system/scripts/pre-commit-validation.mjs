#!/usr/bin/env node
/**
 * Pre-commit validation hook
 *
 * Runs AI Development System validation gates before allowing commits.
 * Integrates the system into active practice.
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { PoliticalNeutralityEnforcer } from '../src/governance/political-neutrality.js';
import { ValidationGate } from '../src/validation/gate.js';

async function main() {
  console.log('🔒 Running AI Development System Pre-Commit Validation...\n');

  // Get staged files
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);

  if (stagedFiles.length === 0) {
    console.log('✅ No staged files to validate');
    return;
  }

  // Initialize validation gate
  const neutralityEnforcer = new PoliticalNeutralityEnforcer();

  const gate = new ValidationGate({
    tier: 0, // Constitutional tier - strictest
    validators: [
      {
        id: 'political-neutrality',
        name: 'Political Neutrality Check',
        async validate(input) {
          if (typeof input !== 'string') {
            return { rule: 'political-neutrality', passed: true };
          }

          const result = await neutralityEnforcer.checkNeutrality(input);
          return {
            rule: 'political-neutrality',
            passed: result.passed,
            message: result.passed
              ? 'Content is politically neutral'
              : `Neutrality issues detected: ${result.biases.map(b => b.description).join(', ')}`,
            severity: result.passed ? 'info' : 'error',
          };
        },
      },
    ],
  });

  // Check content files for political neutrality
  const contentExtensions = ['.md', '.txt', '.ts', '.tsx', '.js', '.jsx'];
  const contentFiles = stagedFiles.filter(
    f =>
      contentExtensions.some(ext => f.endsWith(ext)) &&
      !f.includes('node_modules') &&
      !f.includes('test') &&
      !f.includes('.test.')
  );

  let hasViolations = false;

  for (const file of contentFiles.slice(0, 10)) {
    // Limit to first 10 files for performance
    try {
      const content = readFileSync(file, 'utf8');

      // Skip large files
      if (content.length > 50000) continue;

      // Check for political content keywords
      const politicalKeywords = ['vote', 'voting', 'election', 'political', 'policy', 'govern'];
      const hasPoliticalContent = politicalKeywords.some(kw => content.toLowerCase().includes(kw));

      if (!hasPoliticalContent) continue;

      console.log(`  Validating: ${file}`);
      const result = await gate.validate(content);

      if (!result.passed) {
        hasViolations = true;
        console.error(`  ❌ FAIL: ${file}`);
        for (const ruleResult of result.ruleResults) {
          if (!ruleResult.passed && ruleResult.message) {
            console.error(`     ${ruleResult.message}`);
          }
        }
      } else {
        console.log(`  ✅ PASS: ${file}`);
      }
    } catch (error) {
      console.warn(`  ⚠️  Could not validate ${file}: ${error.message}`);
    }
  }

  if (hasViolations) {
    console.error('\n❌ Pre-commit validation FAILED');
    console.error('Political neutrality violations detected.');
    console.error('Please review and fix the issues above before committing.\n');
    process.exit(1);
  }

  console.log('\n✅ Pre-commit validation PASSED\n');
  process.exit(0);
}

main().catch(error => {
  console.error('Pre-commit validation error:', error);
  process.exit(1);
});
