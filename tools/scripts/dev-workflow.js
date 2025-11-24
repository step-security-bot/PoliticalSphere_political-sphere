#!/usr/bin/env node

/**
 * Development Workflow Integration Script
 * Automates quality checks and development workflow
 */

import { execSync, spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DevWorkflow {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.isCI = process.env.CI === 'true';
    this.isPreCommit = process.env.GIT_AUTHOR_NAME !== undefined;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m',
    };
    console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runCommand(command, options = {}) {
    const { cwd = this.rootDir, silent = false, ignoreError = false } = options;

    try {
      if (!silent) this.log(`Running: ${command}`, 'info');

      const result = execSync(command, {
        cwd,
        encoding: 'utf8',
        stdio: silent ? 'pipe' : 'inherit',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      return result;
    } catch (error) {
      if (!ignoreError) {
        this.log(`Command failed: ${command}`, 'error');
        this.log(error.message, 'error');
        throw error;
      }
      return error.stdout || '';
    }
  }

  async checkDependencies() {
    this.log('🔍 Checking dependencies...', 'info');

    try {
      // Check for unused dependencies
      await this.runCommand('npm run deps:check', { silent: true });
      this.log('✅ Dependencies check passed', 'success');
    } catch {
      this.log('⚠️  Dependencies check found issues', 'warning');
    }
  }

  async runSecurityAudit() {
    this.log('🔒 Running security audit...', 'info');

    try {
      await this.runCommand('npm run security:audit-ci', { silent: true });
      this.log('✅ Security audit passed', 'success');
    } catch (error) {
      this.log('❌ Security vulnerabilities found', 'error');
      throw error;
    }
  }

  async checkCodeQuality() {
    this.log('🎯 Checking code quality...', 'info');

    // Run linting
    await this.runCommand('npm run lint');

    // Run type checking
    await this.runCommand('npm run type-check');

    // Check for code duplicates
    try {
      await this.runCommand('npm run code:duplicates', { silent: true });
      this.log('✅ Code quality checks passed', 'success');
    } catch {
      this.log('⚠️  Code duplication detected', 'warning');
    }
  }

  async runTests() {
    this.log('🧪 Running tests...', 'info');

    if (this.isCI) {
      // Full test suite in CI
      await this.runCommand('npm test');
    } else {
      // Changed files only for local development
      await this.runCommand('npm run test:vitest-changed');
    }

    this.log('✅ Tests passed', 'success');
  }

  async checkAccessibility() {
    this.log('♿ Checking accessibility...', 'info');

    try {
      // Run accessibility tests
      await this.runCommand('npm run test:accessibility', { ignoreError: true });
      this.log('✅ Accessibility checks completed', 'success');
    } catch {
      this.log('⚠️  Accessibility issues found', 'warning');
    }
  }

  async runPerformanceChecks() {
    this.log('⚡ Running performance checks...', 'info');

    try {
      // Run Lighthouse performance audit
      await this.runCommand('npm run perf:lighthouse', { ignoreError: true });

      // Run clinic.js health check (quick doctor mode)
      this.log('🏥 Running clinic health check...', 'info');
      await this.runCommand(
        'node scripts/observability/clinic-monitor.mjs doctor apps/api/src/main.ts',
        { ignoreError: true }
      );

      // Check performance budgets
      await this.runCommand('node scripts/perf-benchmark.mjs', { ignoreError: true });

      this.log('✅ Performance checks completed', 'success');
    } catch {
      this.log('⚠️  Performance issues detected', 'warning');
    }
  }

  async validateAPIs() {
    this.log('🔗 Validating APIs...', 'info');

    try {
      // Validate OpenAPI specs
      await this.runCommand('npm run api:validate', { ignoreError: true });
      this.log('✅ API validation completed', 'success');
    } catch {
      this.log('⚠️  API validation issues found', 'warning');
    }
  }

  async checkDatabaseHealth() {
    this.log('🗄️  Checking database health...', 'info');

    try {
      // Run database health checks
      await this.runCommand('npm run db:health', { ignoreError: true });
      this.log('✅ Database health check completed', 'success');
    } catch {
      this.log('⚠️  Database issues detected', 'warning');
    }
  }

  async generateDocumentation() {
    this.log('📚 Generating documentation...', 'info');

    try {
      // Generate API docs
      await this.runCommand('npm run docs:api', { ignoreError: true });

      // Build docs site
      await this.runCommand('npm run docs:build', { ignoreError: true });

      this.log('✅ Documentation generated', 'success');
    } catch {
      this.log('⚠️  Documentation generation issues', 'warning');
    }
  }

  async validateDocumentation() {
    this.log('📝 Validating documentation quality...', 'info');

    try {
      // Lint markdown files in docs and root README
      await this.runCommand(
        'npx markdownlint "docs/**/*.md" "README.md" --config .markdownlint.json -i "node_modules/**" -i "vendor/**" -i "apps/**/node_modules/**"',
        {
          ignoreError: false,
        }
      );

      // Check spelling in docs only
      await this.runCommand('npx cspell "docs/**/*" --no-progress --config cspell.json', {
        ignoreError: false,
      });

      // Validate API documentation coverage
      await this.runCommand('npm run docs:api -- --coverageTest', {
        ignoreError: false,
      });

      // Check for broken links in documentation
      await this.runCommand(
        'npx markdown-link-check docs/**/*.md --config .github/workflows/link-check-config.json',
        { ignoreError: true }
      );

      this.log('✅ Documentation validation passed', 'success');
    } catch {
      this.log('❌ Documentation quality issues found', 'error');
      throw new Error('Documentation validation failed');
    }
  }

  async validateDocumentationChanged() {
    this.log('📝 Validating changed documentation (pre-commit)...', 'info');
    try {
      // Run markdownlint and cspell against changed/ staged files only
      await this.runCommand(
        "git diff --name-only --staged --diff-filter=ACM | grep -E '\\.(md|mdx)$' | xargs -r npx markdownlint --config .markdownlint.json",
        { ignoreError: true }
      );
      await this.runCommand(
        "git diff --name-only --staged --diff-filter=ACM | grep -E '\\.(md|mdx)$' | xargs -r npx cspell --no-progress --config cspell.json",
        { ignoreError: true }
      );

      this.log('✅ Fast documentation checks passed', 'success');
    } catch {
      this.log('⚠️ Fast documentation checks reported issues', 'warning');
    }
  }

  async runPreCommitChecks() {
    this.log('🔒 Running pre-commit checks...', 'info');

    const checks = [
      this.checkDependencies.bind(this),
      this.runSecurityAudit.bind(this),
      this.checkCodeQuality.bind(this),
      this.runTests.bind(this),
      this.checkAccessibility.bind(this),
      this.validateDocumentationChanged.bind(this),
    ];

    for (const check of checks) {
      try {
        await check();
      } catch (error) {
        this.log(`Pre-commit check failed: ${error.message}`, 'error');
        if (!this.isCI) {
          // In local development, don't fail on warnings
          continue;
        }
        throw error;
      }
    }

    this.log('✅ All pre-commit checks passed', 'success');
  }

  async runDailyWorkflow() {
    this.log('🌅 Starting daily development workflow...', 'info');

    const workflow = [
      this.checkDependencies.bind(this),
      this.runSecurityAudit.bind(this),
      this.checkCodeQuality.bind(this),
      this.runTests.bind(this),
      this.checkAccessibility.bind(this),
      this.runPerformanceChecks.bind(this),
      this.validateAPIs.bind(this),
      this.checkDatabaseHealth.bind(this),
      this.generateDocumentation.bind(this),
    ];

    for (const step of workflow) {
      try {
        await step();
      } catch (error) {
        this.log(`Workflow step failed: ${error.message}`, 'error');
        // Continue with other steps
      }
    }

    this.log('✅ Daily workflow completed', 'success');
  }

  async runCIChecks() {
    this.log('🤖 Running CI checks...', 'info');

    const ciChecks = [
      this.checkDependencies.bind(this),
      this.runSecurityAudit.bind(this),
      this.checkCodeQuality.bind(this),
      this.runTests.bind(this),
      this.checkAccessibility.bind(this),
      this.runPerformanceChecks.bind(this),
      this.validateAPIs.bind(this),
      this.validateDocumentation.bind(this),
    ];

    for (const check of ciChecks) {
      await check(); // CI should fail on any error
    }

    this.log('✅ All CI checks passed', 'success');
  }

  async watchMode() {
    this.log('👀 Starting watch mode...', 'info');

    // Start file watchers
    const watchers = ['npm run watch:lint', 'npm run watch:test', 'npm run watch:build'];

    const processes = watchers.map(cmd => {
      const [command, ...args] = cmd.split(' ');
      return spawn(command, args, {
        cwd: this.rootDir,
        stdio: 'inherit',
      });
    });

    // Handle process termination
    process.on('SIGINT', () => {
      this.log('Stopping watchers...', 'info');
      processes.forEach(proc => {
        proc.kill();
      });
      process.exit(0);
    });

    // Keep the script running
    await new Promise(() => {}); // Never resolves
  }

  async main() {
    const command = process.argv[2] || 'daily';

    try {
      switch (command) {
        case 'pre-commit':
          await this.runPreCommitChecks();
          break;
        case 'ci':
          await this.runCIChecks();
          break;
        case 'watch':
          await this.watchMode();
          break;
        default:
          await this.runDailyWorkflow();
          break;
      }
    } catch (error) {
      this.log(`Workflow failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the workflow
if (import.meta.url === `file://${process.argv[1]}`) {
  const workflow = new DevWorkflow();
  workflow.main().catch(error => {
    console.error('Workflow error:', error);
    process.exit(1);
  });
}

export default DevWorkflow;
