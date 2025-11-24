import express from 'express';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const app = express();
const port = Number(process.env.PORT ?? 4021);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'security-mcp' });
});

app.get('/vulnerabilities', async (_req, res) => {
  try {
    // Run npm audit
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    const auditData = JSON.parse(auditOutput);

    res.json({
      source: 'npm-audit',
      vulnerabilities: auditData.metadata?.vulnerabilities || {},
      total: auditData.metadata?.total || 0,
      note: 'NPM security audit results',
    });
  } catch (error) {
    console.error('Vulnerabilities check error:', error);
    res.status(500).json({ error: 'Failed to check vulnerabilities', details: String(error) });
  }
});

app.get('/secrets-check', async (_req, res) => {
  try {
    // Check for potential secrets in code
    const secretPatterns = [
      /password\s*[:=]\s*['"][^'"]*['"]/gi,
      /api[_-]?key\s*[:=]\s*['"][^'"]*['"]/gi,
      /secret\s*[:=]\s*['"][^'"]*['"]/gi,
      /token\s*[:=]\s*['"][^'"]*['"]/gi,
    ];

    const findings = [];
    const searchFiles = ['.env', '.env.local', '.env.example'];

    for (const file of searchFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of secretPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            findings.push({
              file,
              pattern: pattern.source,
              matches: matches.length,
            });
          }
        }
      }
    }

    res.json({
      source: 'pattern-scan',
      findings,
      scannedFiles: searchFiles,
      note: 'Basic secret pattern detection in environment files',
    });
  } catch (error) {
    console.error('Secrets check error:', error);
    res.status(500).json({ error: 'Failed to check secrets', details: String(error) });
  }
});

app.get('/compliance-status', async (_req, res) => {
  try {
    // Check for security-related files
    const securityFiles = [
      'SECURITY.md',
      '.env.example',
      'package-lock.json',
      'docs/06-security-and-risk/',
    ];

    const fileStatus = {};
    for (const file of securityFiles) {
      fileStatus[file] = fs.existsSync(file);
    }

    // Check if dependencies are pinned
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasPinnedDeps = Object.values(packageJson.dependencies || {}).every(
      version => typeof version === 'string' && !version.includes('^') && !version.includes('~')
    );

    res.json({
      source: 'compliance-check',
      fileStatus,
      pinnedDependencies: hasPinnedDeps,
      note: 'Basic security compliance status',
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    res.status(500).json({ error: 'Failed to check compliance', details: String(error) });
  }
});

app.listen(port, () => {
  console.log(
    `Security MCP server listening on http://localhost:${port} — /health /vulnerabilities /secrets-check /compliance-status`
  );
});
