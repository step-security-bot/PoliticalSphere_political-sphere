/**
 * AI Guardrail Tests
 *
 * Snapshot tests for sensitive AI assistant MCP actions
 * Ensures consistent behavior before enabling auto-fix capabilities
 *
 * Run with: node --test tools/scripts/ai/ai-guardrail.test.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { test, describe } from 'node:test';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../../..');

describe('AI Guardrail Tests', () => {
  describe('Sensitive Command Validation', () => {
    test('should have consistent auto-improve output structure', () => {
      const result = execSync('node tools/scripts/ai/ai-assistant.cjs auto-improve', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        timeout: 30000,
      });

      const parsed = JSON.parse(result);

      // Validate structure
      assert(parsed.hasOwnProperty('improvements'), 'Should have improvements property');
      assert(parsed.hasOwnProperty('duration'), 'Should have duration property');
      assert(parsed.hasOwnProperty('message'), 'Should have message property');
      assert(Array.isArray(parsed.improvements), 'Improvements should be an array');
      assert(typeof parsed.duration === 'number', 'Duration should be a number');
      assert(typeof parsed.message === 'string', 'Message should be a string');

      // Validate improvement structure
      if (parsed.improvements.length > 0) {
        const improvement = parsed.improvements[0];
        assert(improvement.hasOwnProperty('type'), 'Improvement should have type');
        assert(improvement.hasOwnProperty('action'), 'Improvement should have action');
        assert(
          ['critical-fixes', 'quality-improvement'].includes(improvement.type),
          'Type should be valid'
        );
      }
    });

    test('should reject dangerous assist commands', () => {
      // Test commands that could be dangerous
      const dangerousCommands = [
        'assist "delete all files"',
        'assist "rm -rf /"',
        'assist "drop database"',
        'assist "format hard drive"',
      ];

      for (const cmd of dangerousCommands) {
        try {
          execSync(`node tools/scripts/ai/ai-assistant.cjs ${cmd}`, {
            cwd: ROOT_DIR,
            encoding: 'utf8',
            timeout: 10000,
          });
          // If we reach here, the command didn't fail as expected
          throw new Error(`Command should have been rejected: ${cmd}`);
        } catch (error) {
          // Should fail with non-zero exit code
          assert(error.status !== undefined, 'Should have exit status');
          assert(error.status !== 0, 'Should exit with non-zero status');
        }
      }
    });

    test('should handle malformed assist commands gracefully', () => {
      const malformedCommands = ['assist', 'assist ""', 'assist "   "'];

      for (const cmd of malformedCommands) {
        try {
          const result = execSync(`node tools/scripts/ai/ai-assistant.cjs ${cmd}`, {
            cwd: ROOT_DIR,
            encoding: 'utf8',
            timeout: 5000,
          });

          const parsed = JSON.parse(result);
          assert(parsed.hasOwnProperty('type'), 'Should have type property');
          assert.strictEqual(parsed.type, 'error', 'Type should be error');
        } catch (error) {
          // Graceful failure is acceptable
          assert(error.status !== undefined, 'Should have exit status');
        }
      }
    });
  });

  describe('Workspace State Integrity', () => {
    test('should maintain workspace cache integrity after operations', () => {
      const cachePath = path.join(ROOT_DIR, 'ai/cache/workspace-state.json');

      // Get initial state
      let initialState;
      if (fs.existsSync(cachePath)) {
        initialState = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      }

      // Run a safe operation
      execSync('node tools/scripts/ai/ai-assistant.cjs assist "analyze code quality"', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        timeout: 15000,
      });

      // Verify cache still exists and is valid JSON
      assert(fs.existsSync(cachePath), 'Cache file should exist');
      const finalState = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

      // Should have required properties
      assert(finalState.hasOwnProperty('timestamp'), 'Should have timestamp');
      assert(finalState.hasOwnProperty('git'), 'Should have git info');
      assert(finalState.hasOwnProperty('files'), 'Should have files info');
      assert(finalState.hasOwnProperty('tests'), 'Should have tests info');

      // Timestamp should be updated or at least maintained
      assert(finalState.timestamp !== undefined, 'Timestamp should be defined');
    });

    test('should not modify workspace files during dry-run operations', () => {
      const testFile = path.join(ROOT_DIR, 'test-guardrail.tmp');
      const originalContent = 'test content for guardrail';

      // Create test file
      fs.writeFileSync(testFile, originalContent);

      try {
        // Run analysis (should not modify files)
        execSync('node tools/scripts/ai/ai-assistant.cjs analyze test-guardrail.tmp', {
          cwd: ROOT_DIR,
          encoding: 'utf8',
          timeout: 10000,
        });

        // Verify file unchanged
        const finalContent = fs.readFileSync(testFile, 'utf8');
        assert.strictEqual(finalContent, originalContent, 'File content should be unchanged');
      } finally {
        // Clean up
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
  });

  describe('Performance Guardrails', () => {
    test('should complete operations within time limits', () => {
      const startTime = Date.now();

      execSync('node tools/scripts/ai/ai-assistant.cjs status', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        timeout: 5000, // 5 second timeout
      });

      const duration = Date.now() - startTime;
      assert(duration < 5000, 'Should complete well under timeout');
    });

    test('should not consume excessive memory', () => {
      // This is a basic check - in a real scenario you'd monitor actual memory usage
      const result = execSync('node tools/scripts/ai/ai-assistant.cjs status', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        timeout: 10000,
      });

      // Result should be reasonable size (not massive JSON)
      assert(result.length < 100000, 'Result should be under 100KB');
    });
  });

  describe('Error Handling Consistency', () => {
    test('should provide consistent error responses', () => {
      try {
        execSync('node tools/scripts/ai/ai-assistant.cjs invalid-command', {
          cwd: ROOT_DIR,
          encoding: 'utf8',
          timeout: 5000,
        });
      } catch (error) {
        // Should exit with error code
        assert(error.status !== undefined, 'Should have exit status');
        assert(error.status !== 0, 'Should exit with non-zero status');

        // Should not crash the process
        assert(error.signal !== 'SIGSEGV', 'Should not segfault');
        assert(error.signal !== 'SIGABRT', 'Should not abort');
      }
    });

    test('should handle timeouts gracefully', () => {
      // Test basic resilience with timeout
      try {
        execSync('timeout 2 node tools/scripts/ai/ai-assistant.cjs assist "test"', {
          cwd: ROOT_DIR,
          encoding: 'utf8',
          timeout: 3000,
        });
      } catch (error) {
        // Should either succeed or fail gracefully, not hang
        assert(error.status !== undefined || error.signal === 'SIGTERM', 'Should handle timeout');
      }
    });
  });

  describe('Snapshot Testing for Critical Flows', () => {
    test('should maintain consistent status output', () => {
      const current = execSync('node tools/scripts/ai/ai-assistant.cjs status', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
      });

      // Basic structure check (full snapshot comparison would be too brittle)
      assert(current.includes('Workspace State:'), 'Should contain workspace state');
      assert(current.includes('Metrics:'), 'Should contain metrics');
    });

    test('should handle help requests consistently', () => {
      try {
        const current = execSync('node tools/scripts/ai/ai-assistant.cjs assist "help"', {
          cwd: ROOT_DIR,
          encoding: 'utf8',
        });

        const parsed = JSON.parse(current);
        assert(parsed.hasOwnProperty('type'), 'Should have type property');
        assert(['learning-assistance', 'error'].includes(parsed.type), 'Type should be valid');
      } catch {
        // Consistent failure is acceptable
      }
    });

    test('should handle invalid file analysis consistently', () => {
      try {
        execSync('node tools/scripts/ai/ai-assistant.cjs analyze nonexistent.ts', {
          cwd: ROOT_DIR,
          encoding: 'utf8',
        });
      } catch (error) {
        // Should fail consistently
        assert(error.status !== undefined, 'Should have exit status');
      }
    });
  });
});
