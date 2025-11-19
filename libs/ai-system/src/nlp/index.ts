/**
 * Natural Language Processing Module
 *
 * Provides text analysis, generation, and processing capabilities using
 * open-source NLP libraries (Hugging Face Transformers).
 *
 * @module nlp
 */

import { pipeline, Pipeline } from '@huggingface/transformers';

/**
 * NLP Analysis Result
 */
export interface NLPAnalysisResult {
  /** Sentiment analysis result */
  sentiment?: {
    label: string;
    score: number;
  };
  /** Named entities found */
  entities?: Array<{
    entity: string;
    label: string;
    confidence: number;
    start: number;
    end: number;
  }>;
  /** Key phrases/topics */
  keywords?: string[];
  /** Text classification results */
  categories?: Array<{
    label: string;
    score: number;
  }>;
  /** Readability metrics */
  readability?: {
    fleschScore: number;
    gradeLevel: number;
  };
  /** Political bias indicators */
  bias?: {
    score: number;
    indicators: string[];
  };
}

/**
 * Text Generation Options
 */
export interface TextGenerationOptions {
  /** Maximum length of generated text */
  maxLength?: number;
  /** Temperature for randomness (0-1) */
  temperature?: number;
  /** Top-k sampling */
  topK?: number;
  /** Top-p sampling */
  topP?: number;
  /** Number of sequences to generate */
  numReturnSequences?: number;
  /** Stop sequences */
  stopSequences?: string[];
}

/**
 * NLP Service
 *
 * Provides comprehensive NLP capabilities for political content analysis
 */
export class NLPService {
  private sentimentPipeline?: Pipeline;
  private nerPipeline?: Pipeline;
  private classifierPipeline?: Pipeline;
  private generatorPipeline?: Pipeline;

  /**
   * Initialize NLP pipelines
   */
  async initialize(): Promise<void> {
    try {
      // Initialize sentiment analysis
      this.sentimentPipeline = await pipeline(
        'sentiment-analysis',
        'cardiffnlp/twitter-roberta-base-sentiment',
      );

      // Initialize named entity recognition
      this.nerPipeline = await pipeline('ner', 'dbmdz/bert-large-cased-finetuned-conll03-english');

      // Initialize text classification for political topics
      this.classifierPipeline = await pipeline('text-classification', 'facebook/bart-large-mnli');

      // Initialize text generation
      this.generatorPipeline = await pipeline('text-generation', 'gpt2');
    } catch (error) {
      console.warn('Failed to initialize some NLP pipelines:', error);
      // Continue with available pipelines
    }
  }

  /**
   * Analyze text for political content
   */
  async analyzeText(text: string): Promise<NLPAnalysisResult> {
    const result: NLPAnalysisResult = {};

    try {
      // Sentiment analysis
      if (this.sentimentPipeline) {
        const sentiment = await this.sentimentPipeline(text);
        if (Array.isArray(sentiment) && sentiment.length > 0) {
          result.sentiment = {
            label: sentiment[0].label,
            score: sentiment[0].score,
          };
        }
      }

      // Named entity recognition
      if (this.nerPipeline) {
        const entities = await this.nerPipeline(text);
        if (Array.isArray(entities)) {
          result.entities = entities.map((entity: any) => ({
            entity: entity.word,
            label: entity.entity_group || entity.label,
            confidence: entity.score,
            start: entity.start,
            end: entity.end,
          }));
        }
      }

      // Political bias detection (simplified)
      result.bias = this.detectPoliticalBias(text);

      // Keyword extraction (simple implementation)
      result.keywords = this.extractKeywords(text);

      // Readability analysis
      result.readability = this.calculateReadability(text);
    } catch (error) {
      console.error('NLP analysis failed:', error);
    }

    return result;
  }

  /**
   * Generate text using language model
   */
  async generateText(prompt: string, options: TextGenerationOptions = {}): Promise<string[]> {
    if (!this.generatorPipeline) {
      throw new Error('Text generation pipeline not initialized');
    }

    try {
      const result = await this.generatorPipeline(prompt, {
        max_length: options.maxLength || 100,
        temperature: options.temperature || 0.7,
        top_k: options.topK || 50,
        top_p: options.topP || 0.9,
        num_return_sequences: options.numReturnSequences || 1,
        do_sample: true,
      });

      if (Array.isArray(result)) {
        return result.map((item: any) => {
          let text = item.generated_text;
          // Remove the original prompt from the generated text
          if (text.startsWith(prompt)) {
            text = text.slice(prompt.length).trim();
          }
          return text;
        });
      }

      return [];
    } catch (error) {
      console.error('Text generation failed:', error);
      return [];
    }
  }

  /**
   * Classify text into political categories
   */
  async classifyPoliticalText(
    text: string,
    categories: string[],
  ): Promise<Array<{ label: string; score: number }>> {
    if (!this.classifierPipeline) {
      throw new Error('Classification pipeline not initialized');
    }

    try {
      const results = [];

      for (const category of categories) {
        const hypothesis = `This text is about ${category}`;
        const result = await this.classifierPipeline(text, hypothesis);

        if (Array.isArray(result) && result.length > 0) {
          results.push({
            label: category,
            score: result[0].score,
          });
        }
      }

      // Sort by score descending
      return results.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Text classification failed:', error);
      return [];
    }
  }

  /**
   * Detect political bias in text
   */
  private detectPoliticalBias(text: string): { score: number; indicators: string[] } {
    const biasIndicators = {
      left: ['progressive', 'liberal', 'social justice', 'equity', 'systemic racism', 'oppressed'],
      right: ['conservative', 'traditional', 'patriot', 'freedom', 'second amendment', 'pro-life'],
      neutral: ['balanced', 'evidence-based', 'data shows', 'according to studies', 'both sides'],
    };

    const lowerText = text.toLowerCase();
    let leftScore = 0;
    let rightScore = 0;
    let neutralScore = 0;
    const foundIndicators: string[] = [];

    // Count bias indicators
    for (const [bias, indicators] of Object.entries(biasIndicators)) {
      for (const indicator of indicators) {
        if (lowerText.includes(indicator)) {
          foundIndicators.push(indicator);
          if (bias === 'left') leftScore += 1;
          else if (bias === 'right') rightScore += 1;
          else neutralScore += 1;
        }
      }
    }

    // Calculate bias score (-1 to 1, where -1 is left-leaning, 1 is right-leaning)
    const totalBias = leftScore + rightScore;
    const biasScore = totalBias > 0 ? (rightScore - leftScore) / totalBias : 0;

    // Adjust for neutral indicators
    const adjustedScore = neutralScore > 0 ? biasScore * 0.5 : biasScore;

    return {
      score: Math.max(-1, Math.min(1, adjustedScore)),
      indicators: foundIndicators,
    };
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction based on frequency and length
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordFreq: Record<string, number> = {};
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }

    // Return top 10 keywords by frequency
    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Calculate readability metrics
   */
  private calculateReadability(text: string): { fleschScore: number; gradeLevel: number } {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease Score
    const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    // Grade level (approximation)
    const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

    return {
      fleschScore: Math.max(0, Math.min(100, fleschScore)),
      gradeLevel: Math.max(0, gradeLevel),
    };
  }

  /**
   * Count syllables in a word (simple approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;

    for (const char of word) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent 'e'
    if (word.endsWith('e')) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }
}

/**
 * Singleton NLP service instance
 */
export const nlpService = new NLPService();
