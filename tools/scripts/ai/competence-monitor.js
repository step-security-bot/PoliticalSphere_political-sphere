#!/usr/bin/env node
/*
  Competence Monitor: Assess AI performance and provide improvement recommendations
  Usage: node scripts/ai/competence-monitor.js assess
*/

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Metrics live at <repo-root>/ai-metrics/stats.json (tests expect this path)
const METRICS_FILE = resolve(__dirname, '../../../ai-metrics/stats.json');
const PATTERNS_FILE = resolve(__dirname, '../../../ai/ai-learning/patterns.json');

function assessCompetence() {
  if (!existsSync(METRICS_FILE)) {
    console.log('No metrics available. Creating initial metrics file.');
    const initialMetrics = {
      responseTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      qualityGatesPassed: 0,
      qualityGatesFailed: 0,
      userSatisfaction: [],
      taskThroughput: [],
      idleTime: 0,
      productiveTime: 0,
      contextRecallAccuracy: 0,
      semanticUnderstandingScore: 0,
      patternUsageCorrectness: 0,
      modelDriftResistance: 0,
      correctnessRate: 0,
      logicalConsistency: 0,
      testCoverage: 0,
      errorHandlingQuality: 0,
      robustnessScore: 0,
      accessibilityCompliance: 0,
      securityDetection: 0,
      diffSize: 0,
      selfCritiqueEffectiveness: 0,
      observabilityHooks: 0,
      lastUpdated: new Date().toISOString(),
    };
    writeFileSync(METRICS_FILE, JSON.stringify(initialMetrics, null, 2));
    return {
      score: 0.5,
      recommendations: ['Collect more data for accurate assessment'],
    };
  }

  const metrics = JSON.parse(readFileSync(METRICS_FILE, 'utf8'));
  const patterns = existsSync(PATTERNS_FILE)
    ? JSON.parse(readFileSync(PATTERNS_FILE, 'utf8'))
    : { patterns: [] };

  // Ensure arrays exist with defaults
  const responseTimes = metrics.responseTimes || [];
  const taskThroughput = metrics.taskThroughput || [];
  const userSatisfaction = metrics.userSatisfaction || [];

  // Calculate competence score (0-1 scale) with simplified core metrics
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 1000;

  const cacheHitRate =
    metrics.cacheHits + metrics.cacheMisses > 0
      ? metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)
      : 0;

  const qualityPassRate =
    metrics.qualityGatesPassed + metrics.qualityGatesFailed > 0
      ? metrics.qualityGatesPassed / (metrics.qualityGatesPassed + metrics.qualityGatesFailed)
      : 0;

  const avgSatisfaction =
    userSatisfaction.length > 0
      ? userSatisfaction.reduce((a, b) => a + b, 0) / userSatisfaction.length
      : 0.5;

  const avgThroughput =
    taskThroughput.length > 0
      ? taskThroughput.reduce((a, b) => a + b, 0) / taskThroughput.length
      : 1;

  // Simplified weighted score with essential metrics only
  const score =
    Math.max(0, 1 - avgResponseTime / 2000) * 0.2 + // Response time (target < 2s)
    cacheHitRate * 0.2 + // Cache efficiency
    qualityPassRate * 0.2 + // Quality compliance
    avgSatisfaction * 0.2 + // User satisfaction
    Math.min(1, avgThroughput / 10) * 0.2; // Task throughput (target > 10 tasks/hour)

  const recommendations = [];

  if (avgResponseTime > 2000)
    recommendations.push('Optimize response times - consider caching or pre-computation');
  if (cacheHitRate < 0.7) recommendations.push('Improve cache hit rate - review caching strategy');
  if (qualityPassRate < 0.9)
    recommendations.push('Address quality gate failures - review common issues');
  if (avgSatisfaction < 0.7)
    recommendations.push('Improve user satisfaction - gather feedback on suggestions');
  if (avgThroughput < 5)
    recommendations.push('Increase task throughput - optimize parallel processing');

  if (patterns.patterns && patterns.patterns.length > 0) {
    const recentPatterns = patterns.patterns.slice(-10);
    const successRate = recentPatterns.filter(p => p.success).length / recentPatterns.length;
    if (successRate < 0.8)
      recommendations.push('Review recent patterns - identify areas for improvement');
  }

  // Context-awareness specific recommendations (tests assert on these phrases).
  if (metrics.contextRecallAccuracy !== undefined && metrics.contextRecallAccuracy < 0.9) {
    recommendations.push('Enhance context recall');
  }
  if (
    metrics.semanticUnderstandingScore !== undefined &&
    metrics.semanticUnderstandingScore < 0.85
  ) {
    recommendations.push('Improve semantic understanding');
  }
  if (metrics.patternUsageCorrectness !== undefined && metrics.patternUsageCorrectness < 0.95) {
    recommendations.push('Review pattern usage');
  }
  if (metrics.modelDriftResistance !== undefined && metrics.modelDriftResistance < 0.9) {
    recommendations.push('Strengthen model drift resistance');
  }

  return { score: Math.round(score * 100) / 100, recommendations };
}

function main() {
  const result = assessCompetence();

  // Read existing metrics or create new structure
  let metrics = {};
  if (existsSync(METRICS_FILE)) {
    metrics = JSON.parse(readFileSync(METRICS_FILE, 'utf8'));
  }

  // Update with competence assessment
  metrics.competenceScore = result.score;
  metrics.recommendations = result.recommendations;
  metrics.lastAssessment = new Date().toISOString();
  metrics.lastUpdated = new Date().toISOString();

  // Initialize history array if it doesn't exist
  if (!metrics.history) {
    metrics.history = [];
  }

  // Add current assessment to history
  metrics.history.push({
    timestamp: metrics.lastAssessment,
    score: result.score,
    recommendationCount: result.recommendations.length,
  });

  // Keep only last 100 assessments
  if (metrics.history.length > 100) {
    metrics.history = metrics.history.slice(-100);
  }

  // Write updated metrics
  writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));

  console.log(`Competence Score: ${result.score}`);
  console.log('Recommendations:');
  for (const rec of result.recommendations) {
    console.log(`- ${rec}`);
  }
  console.log(`\nMetrics updated: ${METRICS_FILE}`);
}

main();
