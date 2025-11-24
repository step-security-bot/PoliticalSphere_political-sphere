import express from 'express';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT ?? 4020);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'performance-mcp' });
});

app.get('/build-times', async (_req, res) => {
  try {
    // Get Nx build cache stats
    const cacheStats = execSync('npx nx show projects --json', { encoding: 'utf8' });
    const projects = JSON.parse(cacheStats);

    // Get recent build times from Nx cache
    const buildTimes = {};
    for (const project of projects) {
      try {
        const cachePath = path.join(process.cwd(), 'node_modules/.cache/nx', project);
        if (fs.existsSync(cachePath)) {
          const stats = fs.statSync(cachePath);
          buildTimes[project] = {
            lastModified: stats.mtime,
            size: stats.size,
          };
        }
      } catch {
        // Skip projects without cache
      }
    }

    res.json({
      source: 'nx-cache',
      projects: Object.keys(buildTimes).length,
      buildTimes,
      note: 'Build performance data from Nx cache',
    });
  } catch (error) {
    console.error('Build times error:', error);
    res.status(500).json({ error: 'Failed to get build times', details: String(error) });
  }
});

app.get('/bundle-analysis', async (_req, res) => {
  try {
    // Get bundle size information
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const bundleStats = {
      dependencies: Object.keys(packageJson.dependencies || {}).length,
      devDependencies: Object.keys(packageJson.devDependencies || {}).length,
      totalPackages:
        Object.keys(packageJson.dependencies || {}).length +
        Object.keys(packageJson.devDependencies || {}).length,
    };

    // Try to get vitest coverage if available
    let coverage = null;
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    }

    res.json({
      source: 'package-analysis',
      bundleStats,
      coverage,
      note: 'Package and coverage analysis for performance monitoring',
    });
  } catch (error) {
    console.error('Bundle analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze bundle', details: String(error) });
  }
});

app.get('/test-performance', async (_req, res) => {
  try {
    // Run a quick test to measure performance
    const startTime = Date.now();
    execSync('npm run test:fast', { timeout: 30000 });
    const endTime = Date.now();

    const testDuration = endTime - startTime;

    res.json({
      source: 'test-execution',
      duration: testDuration,
      unit: 'milliseconds',
      note: 'Test execution performance measurement',
    });
  } catch (error) {
    console.error('Test performance error:', error);
    res.status(500).json({ error: 'Failed to measure test performance', details: String(error) });
  }
});

app.listen(port, () => {
  console.log(
    `Performance MCP server listening on http://localhost:${port} — /health /build-times /bundle-analysis /test-performance`
  );
});
