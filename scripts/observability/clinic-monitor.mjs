#!/usr/bin/env node

/**
 * Clinic.js performance monitoring integration
 * Usage: node scripts/observability/clinic-monitor.mjs [command] [options]
 *
 * Commands:
 *   doctor    - Run clinic doctor for general diagnostics
 *   flame     - Generate flame graph for CPU profiling
 *   heap      - Monitor heap usage and memory leaks
 *   monitor   - Continuous monitoring during development
 */

import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../..');

const COMMANDS = {
  doctor: 'clinic doctor',
  flame: 'clinic flame',
  heap: 'clinic heapprofiler',
  bubble: 'clinic bubbleprof',
};

function runClinicCommand(command, targetProcess, outputDir = 'clinic-reports') {
  const outputPath = path.join(workspaceRoot, outputDir);

  // Ensure output directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportName = `${command}-${timestamp}`;

  console.log(`🏥 Running clinic ${command} on ${targetProcess}`);
  console.log(`📊 Report will be saved to: ${outputPath}/${reportName}`);

  try {
    // For development monitoring, we'll run clinic on a Node.js process
    const clinicCmd = `${COMMANDS[command]} --dest ${outputPath}/${reportName} -- node ${targetProcess}`;

    if (command === 'monitor') {
      // For continuous monitoring, run in background
      console.log('🔄 Starting continuous monitoring...');
      const child = spawn(
        'clinic',
        ['doctor', '--dest', `${outputPath}/${reportName}`, '--', 'node', targetProcess],
        {
          stdio: 'inherit',
          cwd: workspaceRoot,
        }
      );

      console.log(`📈 Monitoring started. Press Ctrl+C to stop.`);
      console.log(`📋 Report will be available at: ${outputPath}/${reportName}`);

      return child;
    } else {
      // For one-time analysis
      execSync(clinicCmd, {
        stdio: 'inherit',
        cwd: workspaceRoot,
      });

      console.log(`✅ Clinic ${command} completed successfully`);
      console.log(`📋 Report available at: ${outputPath}/${reportName}`);
    }
  } catch (error) {
    console.error(`❌ Clinic ${command} failed:`, error.message);
    process.exit(1);
  }
}

function showUsage() {
  console.log(`
🏥 Clinic.js Performance Monitor

Usage: node scripts/observability/clinic-monitor.mjs <command> [target] [options]

Commands:
  doctor    - General health check and diagnostics
  flame     - CPU flame graph generation
  heap      - Memory heap profiling
  bubble    - Bubble graph for async operations
  monitor   - Continuous monitoring mode

Examples:
  # Run doctor on the API server
  node scripts/observability/clinic-monitor.mjs doctor apps/api/src/main.ts

  # Generate flame graph for web app
  node scripts/observability/clinic-monitor.mjs flame apps/web/src/main.tsx

  # Monitor heap usage during development
  node scripts/observability/clinic-monitor.mjs heap apps/api/src/main.ts

  # Continuous monitoring
  node scripts/observability/clinic-monitor.mjs monitor apps/web/src/main.tsx

Reports are saved to: clinic-reports/
  `);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showUsage();
    return;
  }

  const [command, targetProcess] = args;

  if (!COMMANDS[command]) {
    console.error(`❌ Unknown command: ${command}`);
    showUsage();
    process.exit(1);
  }

  if (!targetProcess) {
    console.error(`❌ Target process required for command: ${command}`);
    showUsage();
    process.exit(1);
  }

  // Check if target file exists
  const targetPath = path.resolve(workspaceRoot, targetProcess);
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Target file not found: ${targetPath}`);
    process.exit(1);
  }

  runClinicCommand(command, targetProcess);
}

// Handle graceful shutdown for monitoring mode
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping clinic monitoring...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
