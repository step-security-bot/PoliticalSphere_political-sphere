/**
 * Orchestration Engine
 *
 * Coordinates multi-agent workflows using various patterns.
 *
 * @module orchestration/engine
 */

import type {
  Agent,
  AgentInput,
  AgentOutput,
  OrchestrationConfig,
  OrchestrationPattern,
} from '../types';
import { SequentialPattern } from './patterns/sequential';
import { ConcurrentPattern } from './patterns/concurrent';
import { config } from '../config';

/**
 * Orchestration engine execution options
 */
export interface ExecutionOptions {
  /** Agents to execute */
  agents: Agent[];
  /** Input prompt */
  prompt: string;
  /** Execution context */
  context?: Record<string, unknown>;
  /** Validators to apply */
  validators?: Array<{ validate: (output: AgentOutput) => Promise<boolean> }>;
  /** Trace ID for observability */
  traceId?: string;
}

/**
 * Orchestration engine execution result
 */
export interface ExecutionResult {
  /** Agent outputs */
  outputs: AgentOutput[];
  /** Execution success */
  success: boolean;
  /** Total execution time */
  executionTime: number;
  /** Validation results */
  validationResults?: Array<{ passed: boolean; message?: string }>;
  /** Error (if failed) */
  error?: {
    message: string;
    code: string;
    agentId?: string;
  };
}

/**
 * Orchestration Engine
 *
 * Manages multi-agent workflows using configurable patterns.
 *
 * @example
 * ```typescript
 * const engine = new OrchestrationEngine({
 *   framework: 'semantic-kernel',
 *   pattern: 'sequential'
 * });
 *
 * const result = await engine.execute({
 *   agents: [researchAgent, analysisAgent],
 *   prompt: 'Analyze political neutrality',
 *   context: { topic: 'governance' }
 * });
 * ```
 */
export class OrchestrationEngine {
  private config: OrchestrationConfig;
  private pattern: OrchestrationPattern;

  constructor(customConfig?: Partial<OrchestrationConfig>) {
    this.config = {
      ...config.orchestration,
      ...customConfig,
    };
    this.pattern = this.config.pattern;
  }

  /**
   * Execute multi-agent workflow
   */
  async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { agents, prompt, context = {}, validators = [], traceId } = options;

    try {
      // Validate inputs
      if (!agents || agents.length === 0) {
        throw new Error('At least one agent is required');
      }

      // Create agent input
      const input: AgentInput = {
        prompt,
        context,
        traceId: traceId || this.generateTraceId(),
      };

      // Execute pattern
      let outputs: AgentOutput[];
      switch (this.pattern) {
        case 'sequential':
          outputs = await this.executeSequential(agents, input);
          break;
        case 'concurrent':
          outputs = await this.executeConcurrent(agents, input);
          break;
        default:
          throw new Error(`Pattern '${this.pattern}' not yet implemented`);
      }

      // Run validators
      const validationResults = await this.validateOutputs(outputs, validators);
      const allValidationsPassed = validationResults.every(r => r.passed);

      return {
        outputs,
        success: allValidationsPassed,
        executionTime: Date.now() - startTime,
        validationResults,
      };
    } catch (error) {
      return {
        outputs: [],
        success: false,
        executionTime: Date.now() - startTime,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'EXECUTION_ERROR',
        },
      };
    }
  }

  /**
   * Execute agents sequentially
   */
  private async executeSequential(agents: Agent[], input: AgentInput): Promise<AgentOutput[]> {
    const pattern = new SequentialPattern();
    return pattern.execute(agents, input);
  }

  /**
   * Execute agents concurrently
   */
  private async executeConcurrent(agents: Agent[], input: AgentInput): Promise<AgentOutput[]> {
    const pattern = new ConcurrentPattern();
    return pattern.execute(agents, input);
  }

  /**
   * Validate agent outputs
   */
  private async validateOutputs(
    outputs: AgentOutput[],
    validators: Array<{ validate: (output: AgentOutput) => Promise<boolean> }>
  ): Promise<Array<{ passed: boolean; message?: string }>> {
    const results: Array<{ passed: boolean; message?: string }> = [];

    for (const output of outputs) {
      for (const validator of validators) {
        try {
          const passed = await validator.validate(output);
          results.push({ passed });
        } catch (error) {
          results.push({
            passed: false,
            message: error instanceof Error ? error.message : 'Validation failed',
          });
        }
      }
    }

    return results;
  }

  /**
   * Generate unique trace ID
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Change orchestration pattern
   */
  setPattern(pattern: OrchestrationPattern): void {
    this.pattern = pattern;
    this.config.pattern = pattern;
  }

  /**
   * Get current configuration
   */
  getConfig(): OrchestrationConfig {
    return { ...this.config };
  }
}
