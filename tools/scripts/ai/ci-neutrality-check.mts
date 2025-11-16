#!/usr/bin/env node
/**
 * Political Neutrality CI/CD Integration
 *
 * Validates political neutrality in commits and PRs.
 * Run this in CI to enforce constitutional neutrality requirements.
 *
 * Standalone implementation - no external dependencies
 */

import * as fs from 'node:fs/promises';

// Political bias patterns to detect
const BIAS_PATTERNS = [
  // Explicit political party mentions (UK context)
  {
    pattern:
      /\b(labour|conservative|tory|liberal democrat|lib dem|green party|snp|plaid cymru)\b/gi,
    description: 'Political party reference',
  },
  // Ideological labels
  {
    pattern: /\b(left-wing|right-wing|socialist|capitalist|marxist|libertarian|centrist)\b/gi,
    description: 'Ideological label',
  },
  // Polarizing political terms
  {
    pattern: /\b(woke|snowflake|fascist|communist|liberal agenda|conservative agenda)\b/gi,
    description: 'Polarizing political language',
  },
  // Opinion words that could indicate bias
  {
    pattern: /\b(obviously wrong|clearly better|obviously superior|obviously inferior)\b/gi,
    description: 'Opinion stated as fact',
  },
];

// Neutral exceptions (allowed in context of game mechanics, testing, or documentation)
const NEUTRAL_EXCEPTIONS = [
  /test.*political/gi,
  /political.*simulation/gi,
  /political.*sphere/gi,
  /political.*game/gi,
  /example.*political/gi,
  /fixture.*political/gi,
  /mock.*political/gi,
];

interface BiasDetection {
  pattern: string;
  description: string;
  location: number;
  context: string;
}

interface NeutralityResult {
  passed: boolean;
  biases: BiasDetection[];
  score: number; // 0-1, where 1 is completely neutral
}

async function checkNeutrality(text: string): Promise<NeutralityResult> {
  const biases: BiasDetection[] = [];

  // Check if content is in a neutral exception context
  const isNeutralContext = NEUTRAL_EXCEPTIONS.some(pattern => pattern.test(text));

  if (!isNeutralContext) {
    for (const { pattern, description } of BIAS_PATTERNS) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          const start = Math.max(0, match.index - 50);
          const end = Math.min(text.length, match.index + match[0].length + 50);
          const context = text.slice(start, end);

          biases.push({
            pattern: match[0],
            description,
            location: match.index,
            context: context.replace(/\n/g, ' '),
          });
        }
      }
    }
  }

  const score = biases.length === 0 ? 1.0 : Math.max(0, 1 - biases.length * 0.1);
  const passed = biases.length === 0 || score >= 0.7; // Allow up to 3 minor biases

  return { passed, biases, score };
}

async function main() {
  console.log('🔍 Running Political Neutrality Validation...\n');

  // Get changed files from git or command line args
  const changedFiles = process.argv.slice(2);

  if (changedFiles.length === 0) {
    console.log('✅ No files to check\n');
    return;
  }

  let failedFiles = 0;
  const results: Array<{ file: string; result: NeutralityResult }> = [];

  for (const file of changedFiles) {
    // Skip binary files and non-text files
    if (
      file.match(/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|pdf|zip|tar|gz)$/i) ||
      file.includes('node_modules/') ||
      file.includes('.git/') ||
      file.includes('dist/') ||
      file.includes('coverage/')
    ) {
      continue;
    }

    try {
      const content = await fs.readFile(file, 'utf-8');
      const result = await checkNeutrality(content);
      results.push({ file, result });

      if (!result.passed) {
        failedFiles++;
        console.error(`❌ ${file} (score: ${result.score.toFixed(2)}):`);
        for (const bias of result.biases) {
          console.error(`   - ${bias.description}: "${bias.pattern}"`);
          console.error(`     Context: ...${bias.context}...`);
        }
        console.error('');
      } else {
        console.log(`✅ ${file} (score: ${result.score.toFixed(2)})`);
      }
    } catch (error) {
      console.warn(
        `⚠️  Skipping ${file}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files checked: ${results.length}`);
  console.log(`   Files passed: ${results.length - failedFiles}`);
  console.log(`   Files failed: ${failedFiles}`);
  console.log(
    `   Average score: ${(results.reduce((sum, r) => sum + r.result.score, 0) / results.length).toFixed(2)}\n`
  );

  if (failedFiles > 0) {
    console.error('❌ Political neutrality validation FAILED');
    console.error('   Please review and remove political bias from the flagged files.');
    console.error(
      '   Note: Test files, fixtures, and examples are allowed to contain political content.\n'
    );
    process.exit(1);
  }

  console.log('✅ Political neutrality validation PASSED\n');
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
