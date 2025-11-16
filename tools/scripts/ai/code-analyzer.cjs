#!/usr/bin/env node
/**
 * Intelligent Code Analyzer
 * Combines semantic index, expert knowledge, and pattern matching
 * for comprehensive AI-powered code analysis
 */

const fs = require('fs');
const path = require('path');

const ExpertKnowledge = require('./expert-knowledge.cjs');
const PatternMatcher = require('./pattern-matcher.cjs');

const AI_DIR = path.join(__dirname, '../../../ai');
const SEMANTIC_INDEX = path.join(AI_DIR, 'index/codebase-index.json');

class CodeAnalyzer {
  constructor() {
    this.expertKnowledge = new ExpertKnowledge();
    this.patternMatcher = new PatternMatcher();
    this.semanticIndex = this.loadSemanticIndex();
  }

  loadSemanticIndex() {
    if (fs.existsSync(SEMANTIC_INDEX)) {
      return JSON.parse(fs.readFileSync(SEMANTIC_INDEX, 'utf8'));
    }
    return { files: {}, symbols: {}, dependencies: {} };
  }

  /**
   * Comprehensive file analysis
   */
  analyzeFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return { error: 'File not found' };
    }

    const code = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    // 1. Pattern analysis (instant)
    const patternResults = this.patternMatcher.analyzeCode(code, relativePath);

    // 2. Semantic analysis (fast)
    const semanticInfo = this.getSemanticInfo(relativePath);

    // 3. Expert recommendations (instant)
    const recommendations = this.getRecommendations(patternResults, code);

    // 4. Quick fixes (instant)
    const quickFixes = this.getQuickFixes(patternResults);

    return {
      file: relativePath,
      analysis: {
        score: patternResults.score,
        issues: patternResults.issues,
        strengths: patternResults.strengths,
        suggestions: patternResults.suggestions,
      },
      semantic: semanticInfo,
      recommendations,
      quickFixes,
      summary: this.generateSummary(patternResults, semanticInfo),
    };
  }

  getSemanticInfo(filePath) {
    const fileInfo = this.semanticIndex.files?.[filePath] || {};
    return {
      exports: fileInfo.exports || [],
      imports: fileInfo.imports || [],
      functions: fileInfo.functions || [],
      classes: fileInfo.classes || [],
      dependencies: fileInfo.dependencies || [],
      complexity: fileInfo.complexity || 'unknown',
    };
  }

  getRecommendations(patternResults, code) {
    const recommendations = [];

    // Security recommendations
    const securityIssues = patternResults.issues.filter(i => i.category === 'security');
    if (securityIssues.length > 0) {
      const securityPattern = this.expertKnowledge.getPattern('security');
      if (securityPattern) {
        recommendations.push({
          type: 'security',
          priority: 'high',
          pattern: securityPattern,
          issues: securityIssues,
        });
      }
    }

    // Performance recommendations
    const perfIssues = patternResults.issues.filter(i => i.category === 'performance');
    if (perfIssues.length > 0) {
      const perfPattern = this.expertKnowledge.getPattern('performance');
      if (perfPattern) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          pattern: perfPattern,
          issues: perfIssues,
        });
      }
    }

    // Testing recommendations
    if (!code.includes('describe(') && !code.includes('test(') && !code.includes('it(')) {
      const testingPattern = this.expertKnowledge.getPattern('testing');
      if (testingPattern) {
        recommendations.push({
          type: 'testing',
          priority: 'medium',
          message: 'No tests found - consider adding test coverage',
          pattern: testingPattern,
        });
      }
    }

    return recommendations;
  }

  getQuickFixes(patternResults) {
    const fixes = [];

    // Map issues to quick fixes
    patternResults.issues.forEach(issue => {
      if (issue.message.includes('console.log')) {
        fixes.push(this.expertKnowledge.getQuickFix('debugging', 'remove-logs'));
      }
      if (issue.message.includes('Sequential awaits')) {
        fixes.push(this.expertKnowledge.getQuickFix('performance', 'parallel-async'));
      }
    });

    return fixes.filter(Boolean);
  }

  generateSummary(patternResults, semanticInfo) {
    const grade =
      patternResults.score >= 90
        ? 'A'
        : patternResults.score >= 80
          ? 'B'
          : patternResults.score >= 70
            ? 'C'
            : patternResults.score >= 60
              ? 'D'
              : 'F';

    return {
      grade,
      score: patternResults.score,
      criticalIssues: patternResults.issues.filter(i => i.severity === 'critical').length,
      totalIssues: patternResults.issues.length,
      exports: semanticInfo.exports?.length || 0,
      imports: semanticInfo.imports?.length || 0,
      recommendation: grade >= 'C' ? 'Good code quality' : 'Needs improvement',
    };
  }

  /**
   * Analyze entire directory
   */
  analyzeDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const results = [];

    const walk = dir => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          walk(fullPath);
        } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
          const analysis = this.analyzeFile(fullPath);
          if (!analysis.error) {
            results.push(analysis);
          }
        }
      });
    };

    walk(dirPath);
    return this.aggregateResults(results);
  }

  aggregateResults(results) {
    const aggregate = {
      totalFiles: results.length,
      averageScore: 0,
      totalIssues: 0,
      criticalIssues: 0,
      fileScores: [],
      topIssues: {},
      recommendations: [],
    };

    results.forEach(result => {
      aggregate.averageScore += result.analysis.score;
      aggregate.totalIssues += result.analysis.issues.length;
      aggregate.criticalIssues += result.analysis.issues.filter(
        i => i.severity === 'critical'
      ).length;
      aggregate.fileScores.push({
        file: result.file,
        score: result.analysis.score,
        issues: result.analysis.issues.length,
      });

      // Collect issue types
      result.analysis.issues.forEach(issue => {
        const key = issue.message;
        aggregate.topIssues[key] = (aggregate.topIssues[key] || 0) + 1;
      });
    });

    aggregate.averageScore = Math.round(aggregate.averageScore / results.length);
    aggregate.fileScores.sort((a, b) => a.score - b.score); // Lowest scores first

    // Top 5 issues
    aggregate.topIssues = Object.entries(aggregate.topIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));

    return aggregate;
  }

  /**
   * Real-time analysis for AI assistants
   */
  quickAnalysis(code, context = {}) {
    // Ultra-fast analysis for AI real-time assistance
    const issues = [];

    // Critical security checks (regex, instant)
    if (/password\s*=\s*['"][^'"]+['"]/.test(code)) {
      issues.push({
        type: 'security',
        severity: 'critical',
        message: 'Hardcoded password',
      });
    }
    if (/api[_-]?key\s*=\s*['"][^'"]+['"]/.test(code)) {
      issues.push({
        type: 'security',
        severity: 'critical',
        message: 'Hardcoded API key',
      });
    }

    // Common mistakes
    if (/var\s+/.test(code)) {
      issues.push({
        type: 'quality',
        severity: 'low',
        message: 'Use const/let',
      });
    }

    // Missing error handling
    if (/await\s+/.test(code) && !/try\s*{/.test(code)) {
      issues.push({
        type: 'reliability',
        severity: 'medium',
        message: 'Add error handling for async',
      });
    }

    return {
      safe: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      suggestions:
        this.expertKnowledge.search(context.query || 'best practices')?.slice(0, 3) || [],
    };
  }
}

// CLI
if (require.main === module) {
  const analyzer = new CodeAnalyzer();
  const command = process.argv[2];

  switch (command) {
    case 'file': {
      const file = process.argv[3];
      if (!file) {
        console.log('Usage: code-analyzer.cjs file <path>');
        process.exit(1);
      }
      const result = analyzer.analyzeFile(file);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case 'dir': {
      const dir = process.argv[3] || '.';
      console.log('Analyzing directory:', dir);
      const result = analyzer.analyzeDirectory(dir);
      console.log('\n=== Aggregate Analysis ===');
      console.log('Total Files:', result.totalFiles);
      console.log('Average Score:', result.averageScore, '/100');
      console.log('Total Issues:', result.totalIssues);
      console.log('Critical Issues:', result.criticalIssues);
      if (result.topIssues.length > 0) {
        console.log('\nTop Issues:');
        result.topIssues.forEach(i => console.log(`  ${i.message} (${i.count}x)`));
      }
      if (result.fileScores.length > 0) {
        console.log('\nLowest Scoring Files:');
        result.fileScores
          .slice(0, 5)
          .forEach(f => console.log(`  ${f.file}: ${f.score}/100 (${f.issues} issues)`));
      }
      break;
    }
    case 'quick': {
      const code = fs.readFileSync(process.argv[3], 'utf8');
      const result = analyzer.quickAnalysis(code);
      console.log('Safe:', result.safe ? '✅' : '❌');
      if (result.issues.length > 0) {
        console.log('Issues:');
        result.issues.forEach(i => console.log(`  [${i.severity}] ${i.message}`));
      }
      break;
    }
    default:
      console.log('Intelligent Code Analyzer');
      console.log('Commands:');
      console.log('  file <path>  - Analyze single file');
      console.log('  dir [path]   - Analyze directory');
      console.log('  quick <file> - Quick safety check');
  }
}

module.exports = CodeAnalyzer;
