#!/usr/bin/env node
/**
 * Detect and quarantine consistently failing tests
 * Analyzes failure patterns and marks tests for quarantine
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const FAILURE_LOG = 'test-failure-patterns.log';
const QUARANTINE_FILE = 'test-quarantine.json';
const FAILURE_THRESHOLD = 3; // Number of failures before quarantine
const TIME_WINDOW_HOURS = 24; // Hours to consider for failure analysis

class FlakyTestDetector {
  constructor() {
    this.failures = new Map();
    this.quarantined = new Set();
  }

  loadExistingData() {
    // Load existing quarantine list
    if (existsSync(QUARANTINE_FILE)) {
      try {
        const data = JSON.parse(readFileSync(QUARANTINE_FILE, 'utf8'));
        this.quarantined = new Set(data.quarantined || []);
        console.log(`📋 Loaded ${this.quarantined.size} quarantined tests`);
      } catch (error) {
        console.warn('⚠️  Failed to load quarantine file:', error.message);
      }
    }

    // Load recent failure patterns
    if (existsSync(FAILURE_LOG)) {
      const lines = readFileSync(FAILURE_LOG, 'utf8')
        .split('\n')
        .filter(line => line.trim());
      const cutoffTime = new Date(Date.now() - TIME_WINDOW_HOURS * 60 * 60 * 1000);

      for (const line of lines) {
        const [timestamp, testName, pattern, error] = line.split(',');
        if (!timestamp || !testName) continue;

        const failureTime = new Date(timestamp);
        if (failureTime >= cutoffTime) {
          if (!this.failures.has(testName)) {
            this.failures.set(testName, []);
          }
          this.failures.get(testName).push({
            timestamp: failureTime,
            pattern,
            error,
          });
        }
      }

      console.log(
        `📊 Analyzed ${this.failures.size} test failure patterns in last ${TIME_WINDOW_HOURS} hours`
      );
    }
  }

  detectFlakyTests() {
    const flakyTests = [];

    for (const [testName, failures] of this.failures) {
      if (this.quarantined.has(testName)) {
        console.log(`🚫 ${testName} already quarantined`);
        continue;
      }

      if (failures.length >= FAILURE_THRESHOLD) {
        const patterns = [...new Set(failures.map(f => f.pattern))];
        const avgTimeBetweenFailures = this.calculateAverageTimeBetweenFailures(failures);

        flakyTests.push({
          testName,
          failureCount: failures.length,
          patterns,
          avgTimeBetweenFailures,
          lastFailure: failures[failures.length - 1].timestamp,
          quarantineReason: `Failed ${failures.length} times with patterns: ${patterns.join(', ')}`,
        });
      }
    }

    return flakyTests;
  }

  calculateAverageTimeBetweenFailures(failures) {
    if (failures.length < 2) return 0;

    const sortedFailures = failures.sort((a, b) => a.timestamp - b.timestamp);
    const intervals = [];

    for (let i = 1; i < sortedFailures.length; i++) {
      intervals.push(sortedFailures[i].timestamp - sortedFailures[i - 1].timestamp);
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  quarantineTests(flakyTests) {
    for (const test of flakyTests) {
      this.quarantined.add(test.testName);
      console.log(`🚨 Quarantining flaky test: ${test.testName}`);
      console.log(`   Reason: ${test.quarantineReason}`);
      console.log(`   Failures: ${test.failureCount}, Patterns: ${test.patterns.join(', ')}`);
    }

    // Save updated quarantine list
    const quarantineData = {
      lastUpdated: new Date().toISOString(),
      quarantined: Array.from(this.quarantined),
      details: flakyTests.reduce((acc, test) => {
        acc[test.testName] = {
          quarantinedAt: new Date().toISOString(),
          reason: test.quarantineReason,
          failureCount: test.failureCount,
          patterns: test.patterns,
        };
        return acc;
      }, {}),
    };

    writeFileSync(QUARANTINE_FILE, JSON.stringify(quarantineData, null, 2));
    console.log(`💾 Saved quarantine list with ${this.quarantined.size} tests`);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTestsAnalyzed: this.failures.size,
        quarantinedTests: this.quarantined.size,
        failureThreshold: FAILURE_THRESHOLD,
        timeWindowHours: TIME_WINDOW_HOURS,
      },
      quarantinedTests: Array.from(this.quarantined),
      recentFailures: Object.fromEntries(
        Array.from(this.failures.entries()).map(([test, failures]) => [
          test,
          {
            count: failures.length,
            lastFailure: failures[failures.length - 1]?.timestamp,
            patterns: [...new Set(failures.map(f => f.pattern))],
          },
        ])
      ),
    };

    writeFileSync('flaky-test-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Generated flaky test report: flaky-test-report.json');
  }
}

// Main execution
const detector = new FlakyTestDetector();
detector.loadExistingData();

const flakyTests = detector.detectFlakyTests();
console.log(`🔍 Found ${flakyTests.length} potentially flaky tests`);

if (flakyTests.length > 0) {
  detector.quarantineTests(flakyTests);
}

detector.generateReport();

console.log('✅ Flaky test detection complete');

// Exit with error if flaky tests found (can be used to fail CI if desired)
process.exit(flakyTests.length > 0 ? 1 : 0);
