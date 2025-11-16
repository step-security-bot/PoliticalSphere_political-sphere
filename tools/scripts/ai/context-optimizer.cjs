#!/usr/bin/env node
/**
 * AI Context Optimizer
 *
 * Smart context window management to maximize relevant information.
 * Inspired by: LangChain, Anthropic's context optimization, GPT best practices.
 *
 * Features:
 * - Smart truncation (keep important parts)
 * - Automatic summarization
 * - Relevance ranking
 * - Token counting
 * - Context compression
 *
 * @source LangChain (memory patterns)
 * @source Anthropic (context optimization)
 * @source OpenAI (token optimization)
 */

class ContextOptimizer {
  constructor(options = {}) {
    this.maxTokens = options.maxTokens || 8000;
    this.reservedTokens = options.reservedTokens || 1000; // For response
    this.availableTokens = this.maxTokens - this.reservedTokens;
  }

  /**
   * Estimate token count (rough approximation)
   * 1 token ≈ 4 characters for English
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Extract most important sentences
   */
  extractImportant(text, maxTokens) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Score sentences by importance
    const scored = sentences.map(sentence => {
      let score = 0;

      // Longer sentences often more important
      score += sentence.length / 100;

      // Technical terms boost score
      const techTerms = ['function', 'class', 'async', 'await', 'return', 'import', 'export'];
      techTerms.forEach(term => {
        if (sentence.toLowerCase().includes(term)) score += 2;
      });

      // Code snippets boost score
      if (sentence.includes('(') && sentence.includes(')')) score += 3;
      if (sentence.includes('{') && sentence.includes('}')) score += 3;

      // Questions often important
      if (sentence.trim().endsWith('?')) score += 2;

      return { sentence: sentence.trim(), score };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Build result staying under token limit
    const result = [];
    let tokens = 0;

    for (const item of scored) {
      const sentenceTokens = this.estimateTokens(item.sentence);
      if (tokens + sentenceTokens <= maxTokens) {
        result.push(item.sentence);
        tokens += sentenceTokens;
      }
    }

    return result.join('. ') + '.';
  }

  /**
   * Compress code by removing comments and whitespace
   */
  compressCode(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*/g, '') // Remove line comments
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/^\s+/gm, '') // Remove leading whitespace
      .trim();
  }

  /**
   * Create smart summary of long text
   */
  summarize(text, maxLength = 500) {
    if (text.length <= maxLength) return text;

    // Try to break at sentence
    const sentences = text.split(/[.!?]+/);
    let summary = '';

    for (const sentence of sentences) {
      if ((summary + sentence).length > maxLength) {
        break;
      }
      summary += sentence + '. ';
    }

    return summary.trim() || text.substring(0, maxLength) + '...';
  }

  /**
   * Optimize context for AI input
   */
  optimize(context) {
    const { code = '', docs = '', history = [], query = '', metadata = {} } = context;

    const sections = [];
    const queryTokens = this.estimateTokens(query);
    let remainingTokens = this.availableTokens - queryTokens;

    // Priority 1: Current query (always include)
    sections.push({ type: 'query', content: query, priority: 1 });

    // Priority 2: Relevant code (compressed)
    if (code) {
      const compressed = this.compressCode(code);
      const codeTokens = this.estimateTokens(compressed);

      if (codeTokens <= remainingTokens * 0.5) {
        sections.push({ type: 'code', content: compressed, priority: 2 });
        remainingTokens -= codeTokens;
      } else {
        // Truncate code
        const targetLength = Math.floor(remainingTokens * 0.5 * 4);
        const truncated = compressed.substring(0, targetLength) + '\n// ... truncated';
        sections.push({ type: 'code', content: truncated, priority: 2 });
        remainingTokens -= this.estimateTokens(truncated);
      }
    }

    // Priority 3: Important documentation
    if (docs && remainingTokens > 0) {
      const important = this.extractImportant(docs, Math.floor(remainingTokens * 0.3));
      sections.push({ type: 'docs', content: important, priority: 3 });
      remainingTokens -= this.estimateTokens(important);
    }

    // Priority 4: Recent history (most recent first)
    if (history.length > 0 && remainingTokens > 0) {
      const recentHistory = history.slice(-3).reverse();
      const historyText = recentHistory
        .map(h => `Q: ${h.query}\nA: ${this.summarize(h.response)}`)
        .join('\n\n');

      const historyTokens = this.estimateTokens(historyText);

      if (historyTokens <= remainingTokens) {
        sections.push({ type: 'history', content: historyText, priority: 4 });
        remainingTokens -= historyTokens;
      }
    }

    // Build optimized context
    sections.sort((a, b) => a.priority - b.priority);

    const optimized = sections.map(s => s.content).join('\n\n---\n\n');

    return {
      context: optimized,
      tokens: this.estimateTokens(optimized),
      maxTokens: this.availableTokens,
      utilization: ((this.estimateTokens(optimized) / this.availableTokens) * 100).toFixed(1) + '%',
      sections: sections.map(s => ({
        type: s.type,
        tokens: this.estimateTokens(s.content),
      })),
    };
  }

  /**
   * Split large text into chunks
   */
  chunkText(text, chunkSize = 2000, overlap = 200) {
    const chunks = [];
    const textLength = text.length;

    for (let i = 0; i < textLength; i += chunkSize - overlap) {
      const chunk = text.substring(i, i + chunkSize);
      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      maxTokens: this.maxTokens,
      availableTokens: this.availableTokens,
      reservedTokens: this.reservedTokens,
    };
  }
}

// CLI interface
if (require.main === module) {
  const optimizer = new ContextOptimizer({ maxTokens: 8000 });

  console.log('🧠 AI Context Optimizer\n');

  // Test with sample context
  const testContext = {
    query: 'How do I implement authentication?',
    code: `
      // User authentication service
      class AuthService {
        async authenticate(username, password) {
          // Validate input
          if (!username || !password) {
            throw new Error('Invalid credentials');
          }
          
          // Hash password
          const hashedPassword = await this.hashPassword(password);
          
          // Check database
          const user = await this.db.findUser(username);
          
          if (!user || user.password !== hashedPassword) {
            throw new Error('Authentication failed');
          }
          
          // Generate token
          return this.generateToken(user);
        }
        
        hashPassword(password) {
          // ❌ NEVER USE SHA-256 for passwords - violates cryptographic standards
          // ✅ Use bcrypt or argon2 for password hashing
          // Example: return await bcrypt.hash(password, 12);
          throw new Error('Password hashing must use bcrypt/argon2, not SHA-256');
        }
        
        generateToken(user) {
          // JWT implementation
          return jwt.sign({ id: user.id }, SECRET_KEY);
        }
      }
    `,
    docs: 'Authentication is the process of verifying user identity. Best practices include using strong password hashing (bcrypt, argon2), implementing rate limiting to prevent brute force attacks, and using secure token generation (JWT with proper expiration). Always validate user input and sanitize data before database queries to prevent SQL injection.',
    history: [
      {
        query: 'What is bcrypt?',
        response:
          'Bcrypt is a password hashing function designed for secure password storage. It includes a salt to protect against rainbow table attacks and is computationally expensive to slow down brute force attempts.',
      },
    ],
    metadata: { file: 'auth-service.js', language: 'javascript' },
  };

  console.log('📝 Test Context:');
  console.log(`   Query: "${testContext.query}"`);
  console.log(`   Code: ${testContext.code.length} chars`);
  console.log(`   Docs: ${testContext.docs.length} chars`);
  console.log(`   History: ${testContext.history.length} items\n`);

  const result = optimizer.optimize(testContext);

  console.log('✅ Optimized Context:');
  console.log(`   Total tokens: ${result.tokens} / ${result.maxTokens}`);
  console.log(`   Utilization: ${result.utilization}`);
  console.log('\n📊 Sections:');
  result.sections.forEach(s => {
    console.log(`   - ${s.type}: ${s.tokens} tokens`);
  });

  console.log('\n📄 Optimized Output:');
  console.log(result.context.substring(0, 500) + '...\n');
}

module.exports = ContextOptimizer;
