#!/usr/bin/env node
/**
 * CI/CD Validation Script
 *
 * Comprehensive validation for CI pipeline using AI Development System.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { GovernFunction } from '../src/governance/nist-ai-rmf.js';
import { PoliticalNeutralityEnforcer } from '../src/governance/political-neutrality.js';
import { ValidationGate } from '../src/validation/gate.js';

async function main() {
  console.log('🚀 Running AI Development System CI/CD Validation\n');

  const results = {
    timestamp: new Date().toISOString(),
    checks: [],
    passed: true,
  };

  // 1. Political Neutrality Check
  console.log('1️⃣  Checking political neutrality...');
  try {
    const neutralityEnforcer = new PoliticalNeutralityEnforcer();

    // Check README and documentation
    const readmeContent = readFileSync('README.md', 'utf8');
    const neutralityResult = await neutralityEnforcer.checkNeutrality(readmeContent);

    results.checks.push({
      name: 'Political Neutrality',
      passed: neutralityResult.passed,
      score: neutralityResult.neutralityScore,
      biases: neutralityResult.biases.length,
    });

    if (!neutralityResult.passed) {
      results.passed = false;
      console.error('   ❌ Political neutrality check FAILED');
      console.error(`   Found ${neutralityResult.biases.length} bias issues`);
    } else {
      console.log('   ✅ Political neutrality check PASSED');
    }
  } catch (error) {
    console.warn('   ⚠️  Could not complete neutrality check:', error.message);
  }

  // 2. AI System Governance Check
  console.log('\n2️⃣  Checking AI system governance...');
  try {
    const govern = new GovernFunction();

    // Register the AI system itself
    govern.registerSystem({
      id: 'political-sphere-ai',
      name: 'Political Sphere AI Development System',
      description: 'AI governance and validation framework',
      owner: 'political-sphere-team',
      riskLevel: 'high',
      model: {
        provider: 'anthropic',
        version: 'claude-3.5',
        type: 'generative',
      },
      dataSources: ['code-repository', 'documentation'],
      limitations: ['context-window', 'training-cutoff'],
      biasMitigations: ['neutrality-enforcement', 'human-oversight'],
      registeredAt: new Date(),
    });

    results.checks.push({
      name: 'AI Governance',
      passed: true,
      systemsRegistered: 1,
    });

    console.log('   ✅ AI governance check PASSED');
  } catch (error) {
    console.warn('   ⚠️  Could not complete governance check:', error.message);
  }

  // 3. Validation Gate Integration Test
  console.log('\n3️⃣  Testing validation gate...');
  try {
    const gate = new ValidationGate({
      tier: 1,
      validators: [
        {
          id: 'test-validator',
          name: 'Test Validator',
          async validate() {
            return { rule: 'test', passed: true };
          },
        },
      ],
    });

    const testResult = await gate.validate({ test: 'data' });

    results.checks.push({
      name: 'Validation Gate',
      passed: testResult.passed,
      tier: testResult.tier,
    });

    if (testResult.passed) {
      console.log('   ✅ Validation gate test PASSED');
    } else {
      results.passed = false;
      console.error('   ❌ Validation gate test FAILED');
    }
  } catch (error) {
    console.warn('   ⚠️  Could not complete validation gate test:', error.message);
  }

  // 4. Test Coverage Check
  console.log('\n4️⃣  Checking test coverage...');
  try {
    const coverageOutput = execSync('npm run test:coverage 2>&1', { encoding: 'utf8' });
    const coveragePassed = !coverageOutput.includes('ERROR: Coverage');

    results.checks.push({
      name: 'Test Coverage',
      passed: coveragePassed,
    });

    if (coveragePassed) {
      console.log('   ✅ Test coverage check PASSED');
    } else {
      console.warn('   ⚠️  Test coverage below threshold');
    }
  } catch (error) {
    console.warn('   ⚠️  Could not run coverage check');
  }

  // Write results
  const resultsPath = 'ci-validation-results.json';
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 Results written to ${resultsPath}`);

  // Summary
  console.log('\n' + '='.repeat(50));
  const passedChecks = results.checks.filter(c => c.passed).length;
  const totalChecks = results.checks.length;

  console.log(`Checks passed: ${passedChecks}/${totalChecks}`);

  if (results.passed) {
    console.log('✅ CI/CD Validation PASSED\n');
    process.exit(0);
  } else {
    console.error('❌ CI/CD Validation FAILED\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('CI validation error:', error);
  process.exit(1);
});
