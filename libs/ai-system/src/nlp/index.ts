/**
 * Natural Language Processing Module
 *
 * Provides text analysis, generation, and processing capabilities using
 * open-source NLP libraries (Hugging Face Transformers).
 *
 * @module nlp
 */
/* eslint-disable no-console */

import { pipeline } from '@huggingface/transformers';
import type {
  TextGenerationPipeline,
  ZeroShotClassificationPipeline,
  TextClassificationPipeline,
  TokenClassificationPipeline,
  Pipeline as TransformersPipeline,
} from '@huggingface/transformers';

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
  private sentimentPipeline?: TextClassificationPipeline;
  private nerPipeline?: TokenClassificationPipeline;
  private classifierPipeline?: ZeroShotClassificationPipeline;
  private generatorPipeline?: TextGenerationPipeline | TransformersPipeline;

  /**
   * Initialize NLP pipelines
   */
  async initialize(): Promise<void> {
    try {
      // Initialize sentiment analysis
      const sentimentTask = pipeline(
        'sentiment-analysis',
        'cardiffnlp/twitter-roberta-base-sentiment'
      );
      this.sentimentPipeline = (await sentimentTask) as TextClassificationPipeline;

      // Initialize named entity recognition
      const nerTask = pipeline('ner', 'dbmdz/bert-large-cased-finetuned-conll03-english');
      this.nerPipeline = (await nerTask) as TokenClassificationPipeline;

      // Initialize text classification for political topics
      const classifierTask = pipeline('zero-shot-classification', 'facebook/bart-large-mnli');
      this.classifierPipeline = (await classifierTask) as ZeroShotClassificationPipeline;

      // Initialize text generation
      const generatorTask = pipeline('text-generation', 'gpt2');
      this.generatorPipeline = (await generatorTask) as TextGenerationPipeline;
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
          const firstResult = sentiment[0];
          if (
            firstResult &&
            typeof firstResult === 'object' &&
            'label' in firstResult &&
            'score' in firstResult
          ) {
            result.sentiment = {
              label: String(firstResult.label),
              score: Number(firstResult.score),
            };
          }
        }
      }

      // Named entity recognition
      if (this.nerPipeline) {
        const entities = await this.nerPipeline(text);
        if (Array.isArray(entities)) {
          result.entities = entities.map((entity: unknown) => {
            const e = entity as {
              word?: string;
              entity_group?: string;
              label?: string;
              score?: number;
              start?: number;
              end?: number;
            };
            return {
              entity: e.word || '',
              label: e.entity_group || e.label || '',
              confidence: e.score || 0,
              start: e.start || 0,
              end: e.end || 0,
            };
          });
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
        return result.map((item: unknown) => {
          const i = item as { generated_text?: string };
          let text = i.generated_text || '';
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
    categories: string[]
  ): Promise<Array<{ label: string; score: number }>> {
    if (!this.classifierPipeline) {
      throw new Error('Classification pipeline not initialized');
    }

    try {
      // Use zero-shot classification with candidate labels
      const result = await this.classifierPipeline(text, categories);

      if (result && typeof result === 'object' && 'labels' in result && 'scores' in result) {
        const labels = result.labels as string[];
        const scores = result.scores as number[];

        return labels
          .map((label, index) => ({
            label,
            score: scores[index] || 0,
          }))
          .sort((a, b) => b.score - a.score);
      }

      return [];
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
