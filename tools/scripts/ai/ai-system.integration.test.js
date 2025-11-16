/**
 * AI System Integration Tests
 *
 * Validates end-to-end AI tool workflows and CI/CD integration
 * Run with: npm test tools/scripts/ai/ai-system.integration.test.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../../..');

describe('AI System Integration Tests', () => {
  describe('Smoke Test Suite', () => {
    it('should pass all smoke tests', () => {
      const result = execSync('bash tools/scripts/ai/smoke.sh', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        timeout: 60000,
      });

      expect(result).toContain('✅ All AI tools smoke tests passed');
      expect(result).not.toContain('❌');
    }, 60000);
  });

  describe('Code Indexer', () => {
    it('should build index successfully', () => {
      const result = execSync('node tools/scripts/ai/code-indexer.js build', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        timeout: 120000,
      });

      expect(result).not.toContain('Error');
      expect(fs.existsSync(path.join(ROOT_DIR, 'ai-index'))).toBe(true);
    }, 120000);

    it('should validate index structure', () => {
      const indexPath = path.join(ROOT_DIR, 'ai-index/codebase-index.json');
      expect(fs.existsSync(indexPath)).toBe(true);

      const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      expect(index).toHaveProperty('files');
      expect(index).toHaveProperty('tokens');
      expect(index).toHaveProperty('lastUpdated');
    });

    it('should search index and return results', () => {
      const result = execSync('node tools/scripts/ai/code-indexer.js search "function"', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
      });

      const searchResult = JSON.parse(result);
      expect(searchResult).toHaveProperty('query');
      expect(searchResult).toHaveProperty('count');
      expect(searchResult).toHaveProperty('results');
      expect(Array.isArray(searchResult.results)).toBe(true);
    });
  });

  describe('Context Preloader', () => {
    it('should preload context bundles', () => {
      const result = execSync('node tools/scripts/ai/context-preloader.js preload', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        timeout: 30000,
      });

      expect(result).toContain('Context cache built');
    }, 30000);

    it('should retrieve specific context', () => {
      const result = execSync('node tools/scripts/ai/context-preloader.js get config', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
      });

      const context = JSON.parse(result);
      expect(context).toHaveProperty('name');
      expect(context.name).toBe('config');
    });
  });

  describe('Competence Monitor', () => {
    it('should assess competence and generate metrics', () => {
      const result = execSync('node tools/scripts/ai/competence-monitor.js assess', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
      });

      expect(result).toContain('Competence Score:');
      expect(fs.existsSync(path.join(ROOT_DIR, 'ai-metrics/stats.json'))).toBe(true);
    });

    it('should maintain competence score above minimum threshold', () => {
      const stats = JSON.parse(
        fs.readFileSync(path.join(ROOT_DIR, 'ai-metrics/stats.json'), 'utf8')
      );

      // Competence score should be >= 0.2 (minimum viable threshold)
      // Score is based on response time, cache hit rate, quality pass rate,
      // user satisfaction, and task throughput
      expect(stats.competenceScore).toBeGreaterThanOrEqual(0.2);
      expect(stats.competenceScore).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Index Server', () => {
    let serverProcess;

    beforeAll(() => {
      // Start index server in background
      const { spawn } = require('child_process');
      serverProcess = spawn('node', ['tools/scripts/ai/index-server.js'], {
        cwd: ROOT_DIR,
        detached: false,
      });

      // Wait for server to start
      return new Promise(resolve => setTimeout(resolve, 3000));
    });

    afterAll(() => {
      // Kill server process
      if (serverProcess) {
        serverProcess.kill();
      }
    });

    it('should respond to health check', async () => {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
    });

    it('should handle search requests', async () => {
      const response = await fetch('http://localhost:3001/search?q=function');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    });

    it('should return metrics', async () => {
      const response = await fetch('http://localhost:3001/metrics');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('files');
    });

    it('should validate search query parameters', async () => {
      const response = await fetch('http://localhost:3001/search?q=');

      expect(response.status).toBe(400);
    });
  });

  describe('Neutrality Validation', () => {
    it('should detect political bias in test data', () => {
      const testFile = path.join(__dirname, 'test-biased-content.tmp.ts');

      // Create temporary file with biased content in strings and comments
      fs.writeFileSync(
        testFile,
        `
        // This is clearly a labour party policy
        const policy = "The conservative approach is obviously wrong";
        const voters = "left-wing socialist ideas are superior";
        `
      );

      try {
        execSync(`node tools/scripts/ai/ci-neutrality-check.mts ${testFile}`, {
          cwd: ROOT_DIR,
          encoding: 'utf8',
        });
        // Should throw if bias detected
        throw new Error('Expected neutrality check to fail');
      } catch (error) {
        // Check if the error is from execSync (non-zero exit code)
        if (error.status === 1) {
          // Success - neutrality check failed as expected
          expect(error.status).toBe(1);
        } else if (error.message === 'Expected neutrality check to fail') {
          // The check passed when it should have failed - this is a test failure
          throw error;
        }
        // Other errors should also be thrown
      } finally {
        // Clean up
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    it('should pass neutral content', () => {
      const testFile = path.join(__dirname, 'test-neutral-content.tmp.ts');

      fs.writeFileSync(
        testFile,
        `
        const policyA = getPolicy('economic');
        const votersGroupB = filterVoters('demographic');
        const gameSimulation = runSimulation('political-sphere');
        `
      );

      try {
        const result = execSync(`node tools/scripts/ai/ci-neutrality-check.mts ${testFile}`, {
          cwd: ROOT_DIR,
          encoding: 'utf8',
        });

        expect(result).toContain('Political neutrality validation PASSED');
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
  });

  describe('CI/CD Workflow Integration', () => {
    it('should have ai-maintenance.yml workflow', () => {
      const workflowPath = path.join(ROOT_DIR, '.github/workflows/ai-maintenance.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);

      const content = fs.readFileSync(workflowPath, 'utf8');
      expect(content).toContain('AI Maintenance');
      expect(content).toContain('build-ai-indices');
      expect(content).toContain('competence-assessment');
      expect(content).toContain('smoke-test');
    });

    it('should have enhanced ai-governance.yml workflow', () => {
      const workflowPath = path.join(ROOT_DIR, '.github/workflows/ai-governance.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);

      const content = fs.readFileSync(workflowPath, 'utf8');
      expect(content).toContain('political-neutrality');
      expect(content).toContain('semantic-quality-check');
      expect(content).toContain('competence-assessment');
      expect(content).toContain('change-budget-validation');
    });

    it('should have AI hooks in lefthook.yml', () => {
      const lefthookPath = path.join(ROOT_DIR, '.lefthook.yml');
      expect(fs.existsSync(lefthookPath)).toBe(true);

      const content = fs.readFileSync(lefthookPath, 'utf8');
      expect(content).toContain('ai-neutrality-check');
      expect(content).toContain('ai-semantic-quality');
      expect(content).toContain('ai-competence-quick');
      expect(content).toContain('update-ai-index');
    });
  });

  describe('Documentation Completeness', () => {
    it('should have AI tools status inventory', () => {
      const statusPath = path.join(ROOT_DIR, 'tools/scripts/ai/AI_TOOLS_STATUS.md');
      expect(fs.existsSync(statusPath)).toBe(true);

      const content = fs.readFileSync(statusPath, 'utf8');
      expect(content).toContain('AI Tools Status Inventory');
      expect(content).toContain('OPERATIONAL');
      expect(content).toContain('PENDING_TESTING');
    });

    it('should have AI maintenance SOP', () => {
      const sopPath = path.join(
        ROOT_DIR,
        'docs/05-engineering-and-devops/sops/ai-maintenance-sop.md'
      );
      expect(fs.existsSync(sopPath)).toBe(true);

      const content = fs.readFileSync(sopPath, 'utf8');
      expect(content).toContain('AI Maintenance Standard Operating Procedure');
      expect(content).toContain('Routine Maintenance Tasks');
      expect(content).toContain('Troubleshooting Guide');
      expect(content).toContain('Escalation Procedures');
    });

    it('should have AI system usage guide', () => {
      const guidePath = path.join(
        ROOT_DIR,
        'docs/05-engineering-and-devops/ai-system-usage-guide.md'
      );
      expect(fs.existsSync(guidePath)).toBe(true);

      const content = fs.readFileSync(guidePath, 'utf8');
      expect(content).toContain('AI System Usage Guide');
      expect(content).toContain('Daily Developer Workflow');
      expect(content).toContain('AI Tools Reference');
      expect(content).toContain('Best Practices');
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should generate metrics files', () => {
      const metricsDir = path.join(ROOT_DIR, 'ai-metrics');
      expect(fs.existsSync(metricsDir)).toBe(true);

      const statsPath = path.join(metricsDir, 'stats.json');
      expect(fs.existsSync(statsPath)).toBe(true);
    });

    it('should track competence history', () => {
      const stats = JSON.parse(
        fs.readFileSync(path.join(ROOT_DIR, 'ai-metrics/stats.json'), 'utf8')
      );

      expect(stats).toHaveProperty('competenceScore');
      expect(stats).toHaveProperty('lastAssessment');
      expect(stats).toHaveProperty('history');
      expect(Array.isArray(stats.history)).toBe(true);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full AI-assisted development cycle', async () => {
      // 1. Build index
      execSync('node tools/scripts/ai/code-indexer.js build', {
        cwd: ROOT_DIR,
        timeout: 120000,
      });

      // 2. Preload context
      execSync('node tools/scripts/ai/context-preloader.js preload', {
        cwd: ROOT_DIR,
        timeout: 30000,
      });

      // 3. Search for code
      const searchResult = execSync('node tools/scripts/ai/code-indexer.js search "test"', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
      });
      expect(JSON.parse(searchResult)).toBeDefined();

      // 4. Run competence assessment
      execSync('node tools/scripts/ai/competence-monitor.js assess', {
        cwd: ROOT_DIR,
      });

      // 5. Verify all components operational
      const stats = JSON.parse(
        fs.readFileSync(path.join(ROOT_DIR, 'ai-metrics/stats.json'), 'utf8')
      );
      expect(stats.competenceScore).toBeDefined();
    }, 180000);
  });
});
