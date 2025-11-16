#!/usr/bin/env node
/**
 * Unified AI Intelligence Hub
 * Single interface for all AI capabilities
 * Lightning-fast responses with comprehensive knowledge
 */

const fs = require('fs');
const path = require('path');

const CodeAnalyzer = require('./code-analyzer.cjs');
const ExpertKnowledge = require('./expert-knowledge.cjs');
const PatternMatcher = require('./pattern-matcher.cjs');

const AI_DIR = path.join(__dirname, '../../../ai');
const CONTEXT_DIR = path.join(__dirname, '../../../tools/ai/context-bundles');
const CACHE_FILE = path.join(AI_DIR, 'cache/cache.json');

class AIHub {
  constructor() {
    this.expert = new ExpertKnowledge();
    this.expert.load(); // Load knowledge base
    this.patterns = new PatternMatcher();
    this.analyzer = new CodeAnalyzer();
    this.cache = this.loadCache();
    this.contextBundles = this.loadContextBundles();
  }

  loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      return new Map(data.entries || []);
    }
    return new Map();
  }

  loadContextBundles() {
    const bundles = {};
    if (fs.existsSync(CONTEXT_DIR)) {
      const files = fs.readdirSync(CONTEXT_DIR);
      files.forEach(file => {
        if (file.endsWith('.md')) {
          const name = file.replace('.md', '');
          bundles[name] = fs.readFileSync(path.join(CONTEXT_DIR, file), 'utf8');
        }
      });
    }
    return bundles;
  }

  /**
   * Main query interface - handles all types of requests
   */
  async query(question, context = {}) {
    const startTime = Date.now();

    // 1. Check cache first (instant)
    const cacheKey = this.getCacheKey(question);
    if (this.cache.has(cacheKey) && !context.noCache) {
      const cached = this.cache.get(cacheKey);
      return {
        ...cached,
        cached: true,
        responseTime: Date.now() - startTime,
      };
    }

    // 2. Determine query type and route
    const response = await this.routeQuery(question, context);

    // 3. Cache successful responses
    if (response && !response.error) {
      this.cache.set(cacheKey, response);
      this.saveCache();
    }

    response.responseTime = Date.now() - startTime;
    return response;
  }

  async routeQuery(question, context) {
    const q = question.toLowerCase();

    // Code analysis queries
    if (q.includes('analyze') || q.includes('check') || q.includes('review')) {
      return this.handleCodeAnalysis(question, context);
    }

    // Pattern/solution lookups
    if (q.includes('pattern') || q.includes('how to') || q.includes('best practice')) {
      return this.handlePatternLookup(question, context);
    }

    // Error/problem solving
    if (q.includes('error') || q.includes('fix') || q.includes('broken') || q.includes('failing')) {
      return this.handleErrorSolving(question, context);
    }

    // Context queries
    if (q.includes('recent') || q.includes('todo') || q.includes('what changed')) {
      return this.handleContextQuery(question, context);
    }

    // General knowledge
    return this.handleGeneralQuery(question, context);
  }

  handleCodeAnalysis(question, context) {
    if (context.file) {
      const analysis = this.analyzer.analyzeFile(context.file);
      return {
        type: 'code-analysis',
        question,
        analysis,
        recommendations: this.expert.search(question),
      };
    }

    if (context.code) {
      const quick = this.analyzer.quickAnalysis(context.code, {
        query: question,
      });
      return {
        type: 'quick-analysis',
        question,
        safe: quick.safe,
        issues: quick.issues,
        suggestions: quick.suggestions,
      };
    }

    return {
      type: 'code-analysis',
      question,
      message: 'Provide file path or code snippet for analysis',
      help: 'Use context.file or context.code',
    };
  }

  handlePatternLookup(question, context) {
    const q = question.toLowerCase();

    // Identify pattern type
    let category = null;
    if (q.includes('error') || q.includes('exception')) category = 'errorHandling';
    else if (q.includes('test')) category = 'testing';
    else if (q.includes('security') || q.includes('auth')) category = 'security';
    else if (q.includes('performance') || q.includes('fast') || q.includes('slow'))
      category = 'performance';
    else if (q.includes('architecture') || q.includes('structure')) category = 'architecture';

    if (category) {
      const pattern = this.expert.getPattern(category);
      const bestPractice = this.expert.getBestPractice(category.includes('test') ? 'code' : 'PRs');

      return {
        type: 'pattern-lookup',
        question,
        category,
        pattern,
        bestPractice,
        relatedSolutions: this.expert.search(question),
      };
    }

    // General best practices
    return {
      type: 'pattern-lookup',
      question,
      results: this.expert.search(question),
      bestPractices: this.expert.getBestPractice('code'),
    };
  }

  handleErrorSolving(question, context) {
    const q = question.toLowerCase();

    // Common error patterns
    const errorTypes = {
      ENOENT: 'ENOENT',
      EADDRINUSE: 'EADDRINUSE',
      MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
      'test fail': 'testFailure',
      'build fail': 'buildFailure',
    };

    let solution = null;
    for (const [pattern, type] of Object.entries(errorTypes)) {
      if (q.includes(pattern.toLowerCase())) {
        solution = this.expert.getSolution(type);
        break;
      }
    }

    if (solution) {
      const quickFix = this.expert.getQuickFix('debugging', 'logs');
      return {
        type: 'error-solution',
        question,
        solution,
        quickFix,
        relatedPatterns: this.expert.search(question),
      };
    }

    // Generic debugging help
    return {
      type: 'error-solution',
      question,
      suggestions: this.expert.search('debugging'),
      quickFixes: [
        this.expert.getQuickFix('debugging', 'logs'),
        this.expert.getQuickFix('debugging', 'clean-restart'),
      ],
    };
  }

  handleContextQuery(question, context) {
    const q = question.toLowerCase();
    const relevantBundles = [];

    if (q.includes('recent') || q.includes('changed')) {
      relevantBundles.push(this.contextBundles['recent-changes']);
    }
    if (q.includes('todo') || q.includes('task')) {
      relevantBundles.push(this.contextBundles['active-tasks']);
    }
    if (q.includes('structure') || q.includes('files')) {
      relevantBundles.push(this.contextBundles['project-structure']);
    }
    if (q.includes('error') || q.includes('log')) {
      relevantBundles.push(this.contextBundles['error-patterns']);
    }

    return {
      type: 'context-query',
      question,
      bundles: relevantBundles.filter(Boolean),
      projectInfo: this.expert.getProjectInfo(),
    };
  }

  handleGeneralQuery(question, context) {
    return {
      type: 'general',
      question,
      expertSearch: this.expert.search(question),
      projectInfo: this.expert.getProjectInfo(),
      availableContext: Object.keys(this.contextBundles),
    };
  }

  getCacheKey(str) {
    // Simple hash for cache key
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  saveCache() {
    const data = {
      entries: Array.from(this.cache.entries()),
      updated: new Date().toISOString(),
    };
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  }

  /**
   * Get comprehensive context for AI
   */
  getFullContext() {
    return {
      bundles: this.contextBundles,
      projectInfo: this.expert.getProjectInfo(),
      expertise: {
        patterns: ['errorHandling', 'testing', 'security', 'performance', 'architecture'],
        solutions: ['ENOENT', 'EADDRINUSE', 'MODULE_NOT_FOUND', 'testFailure', 'buildFailure'],
        quickFixes: this.expert.knowledge?.quickFixes || {},
      },
      stats: {
        cachedQueries: this.cache.size,
        contextBundles: Object.keys(this.contextBundles).length,
      },
    };
  }

  /**
   * Statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      contextBundles: Object.keys(this.contextBundles).length,
      expertKnowledge: {
        patterns: Object.keys(this.expert.knowledge?.patterns || {}).length,
        solutions: Object.keys(this.expert.knowledge?.solutions || {}).length,
      },
    };
  }
}

// CLI
if (require.main === module) {
  const hub = new AIHub();
  const command = process.argv[2];

  switch (command) {
    case 'query': {
      const question = process.argv.slice(3).join(' ');
      hub.query(question).then(result => {
        console.log(JSON.stringify(result, null, 2));
      });
      break;
    }
    case 'analyze': {
      const file = process.argv[3];
      hub.query('analyze code', { file }).then(result => {
        console.log(JSON.stringify(result, null, 2));
      });
      break;
    }
    case 'context': {
      const ctx = hub.getFullContext();
      console.log('Available Context Bundles:', Object.keys(ctx.bundles));
      console.log('Expert Knowledge Areas:', ctx.expertise.patterns);
      console.log('Stats:', ctx.stats);
      break;
    }
    case 'stats': {
      console.log(hub.getStats());
      break;
    }
    default:
      console.log('AI Intelligence Hub');
      console.log('Commands:');
      console.log('  query <question>  - Ask anything');
      console.log('  analyze <file>    - Analyze code file');
      console.log('  context           - Show available context');
      console.log('  stats             - Show statistics');
  }
}

module.exports = AIHub;
