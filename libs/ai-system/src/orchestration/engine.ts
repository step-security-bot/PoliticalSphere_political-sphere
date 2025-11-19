/**
 * Orchestration Engine
 *
 * Coordinates multi-agent workflows using various patterns.
 *
 * @module orchestration/engine
 */

import { config } from '../config';
import type {
  Agent,
  AgentInput,
  AgentOutput,
  Message,
  OrchestrationConfig,
  OrchestrationPattern,
} from '../types/index';

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
        case 'handoff':
          outputs = await this.executeHandoff(agents, input);
          break;
        case 'group-chat':
          outputs = await this.executeGroupChat(agents, input);
          break;
        case 'magentic':
          outputs = await this.executeMagentic(agents, input);
          break;
        default:
          throw new Error(`Pattern '${this.pattern}' not implemented`);
      }

      // Run validators
      const validationResults = await this.validateOutputs(outputs, validators);
      const allValidationsPassed = validationResults.every(r => r.passed);
      const hasErrors = outputs.some(o => o.error);

      return {
        outputs,
        success: allValidationsPassed && !hasErrors,
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
    const outputs: AgentOutput[] = [];
    let currentInput = input;

    for (const agent of agents) {
      try {
        const startTime = Date.now();
        const output = await agent.execute(currentInput);
        const executionTime = Date.now() - startTime;

        const standardizedOutput: AgentOutput = {
          agentId: agent.id,
          content: output.content || '',
          metadata: {
            executionTime,
            timestamp: new Date(),
            ...(output.metadata && typeof output.metadata === 'object' ? output.metadata : {}),
          },
        };

        outputs.push(standardizedOutput);

        // Prepare input for next agent
        currentInput = {
          ...currentInput,
          previousOutputs: outputs,
          context: {
            ...currentInput.context,
            lastOutput: standardizedOutput.content,
          },
        };
      } catch (error) {
        const errorOutput: AgentOutput = {
          agentId: agent.id,
          content: '',
          metadata: {
            executionTime: 0,
            timestamp: new Date(),
          },
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: 'EXECUTION_ERROR',
          },
        };

        outputs.push(errorOutput);
        break; // Stop on first error for sequential execution
      }
    }
    return outputs;
  }

  /**
   * Execute agents concurrently
   */
  private async executeConcurrent(agents: Agent[], input: AgentInput): Promise<AgentOutput[]> {
    const promises = agents.map(async agent => {
      try {
        const startTime = Date.now();
        const output = await agent.execute(input);
        const executionTime = Date.now() - startTime;

        return {
          agentId: agent.id,
          content: output.content || '',
          metadata: {
            executionTime,
            timestamp: new Date(),
            ...(output.metadata && typeof output.metadata === 'object' ? output.metadata : {}),
          },
        };
      } catch (error) {
        return {
          agentId: agent.id,
          content: '',
          metadata: {
            executionTime: 0,
            timestamp: new Date(),
          },
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: 'EXECUTION_ERROR',
          },
        };
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Execute agents in handoff pattern (one agent passes to another based on conditions)
   */
  private async executeHandoff(agents: Agent[], input: AgentInput): Promise<AgentOutput[]> {
    const outputs: AgentOutput[] = [];
    let currentInput = input;
    let currentAgentIndex = 0;

    while (currentAgentIndex < agents.length) {
      const agent = agents[currentAgentIndex];
      try {
        const startTime = Date.now();
        const output = await agent.execute(currentInput);
        const executionTime = Date.now() - startTime;

        const standardizedOutput: AgentOutput = {
          agentId: agent.id,
          content: output.content || '',
          metadata: {
            executionTime,
            timestamp: new Date(),
            ...(output.metadata && typeof output.metadata === 'object' ? output.metadata : {}),
          },
        };

        outputs.push(standardizedOutput);

        // Check if handoff is needed (simple implementation: continue to next agent)
        // In a real implementation, this would check conditions in the output
        currentAgentIndex++;
        currentInput = {
          ...currentInput,
          previousOutputs: outputs,
          context: {
            ...currentInput.context,
            lastOutput: standardizedOutput.content,
          },
        };
      } catch (error) {
        const errorOutput: AgentOutput = {
          agentId: agent.id,
          content: '',
          metadata: {
            executionTime: 0,
            timestamp: new Date(),
          },
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: 'EXECUTION_ERROR',
          },
        };

        outputs.push(errorOutput);
        break; // Stop on first error
      }
    }

    return outputs;
  }

  /**
   * Execute agents in group chat pattern (all agents can respond to each other)
   */
  private async executeGroupChat(agents: Agent[], input: AgentInput): Promise<AgentOutput[]> {
    const outputs: AgentOutput[] = [];
    const conversation: Message[] = [{ role: 'user', content: input.prompt }];
    let rounds = 3; // Maximum rounds to prevent infinite loops

    for (let round = 0; round < rounds; round++) {
      let roundOutputs: AgentOutput[] = [];

      for (const agent of agents) {
        try {
          const agentInput: AgentInput = {
            ...input,
            prompt: conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n'),
            context: {
              ...input.context,
              conversation,
              round,
            },
          };

          const startTime = Date.now();
          const output = await agent.execute(agentInput);
          const executionTime = Date.now() - startTime;

          const standardizedOutput: AgentOutput = {
            agentId: agent.id,
            content: output.content || '',
            metadata: {
              executionTime,
              timestamp: new Date(),
              round,
              ...(output.metadata && typeof output.metadata === 'object' ? output.metadata : {}),
            },
          };

          roundOutputs.push(standardizedOutput);
          conversation.push({
            role: 'assistant',
            content: standardizedOutput.content,
            name: agent.id,
          });
        } catch (error) {
          const errorOutput: AgentOutput = {
            agentId: agent.id,
            content: '',
            metadata: {
              executionTime: 0,
              timestamp: new Date(),
              round,
            },
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              code: 'EXECUTION_ERROR',
            },
          };

          roundOutputs.push(errorOutput);
        }
      }

      outputs.push(...roundOutputs);

      // Check if conversation should continue (simple implementation: always continue for max rounds)
      if (roundOutputs.every(output => !output.content || output.error)) {
        break; // Stop if no meaningful output
      }
    }

    return outputs;
  }

  /**
   * Execute agents in magentic pattern (magnetic orchestration with specialized roles)
   */
  private async executeMagentic(agents: Agent[], input: AgentInput): Promise<AgentOutput[]> {
    // Simplified magentic pattern: coordinator + workers
    if (agents.length < 2) {
      throw new Error('Magentic pattern requires at least 2 agents (coordinator + worker)');
    }

    const coordinator = agents[0];
    const workers = agents.slice(1);
    const outputs: AgentOutput[] = [];

    // Coordinator plans the work
    try {
      const startTime = Date.now();
      const planOutput = await coordinator.execute(input);
      const executionTime = Date.now() - startTime;

      const plan: AgentOutput = {
        agentId: coordinator.id,
        content: planOutput.content || '',
        metadata: {
          executionTime,
          timestamp: new Date(),
          role: 'coordinator',
          ...(planOutput.metadata && typeof planOutput.metadata === 'object'
            ? planOutput.metadata
            : {}),
        },
      };

      outputs.push(plan);

      // Workers execute in parallel based on plan
      const workerPromises = workers.map(async worker => {
        const workerInput: AgentInput = {
          ...input,
          prompt: `Plan: ${plan.content}\n\nExecute your part of the plan.`,
          context: {
            ...input.context,
            plan: plan.content,
            role: 'worker',
          },
        };

        try {
          const startTime = Date.now();
          const output = await worker.execute(workerInput);
          const executionTime = Date.now() - startTime;

          return {
            agentId: worker.id,
            content: output.content || '',
            metadata: {
              executionTime,
              timestamp: new Date(),
              role: 'worker',
              ...(output.metadata && typeof output.metadata === 'object' ? output.metadata : {}),
            },
          };
        } catch (error) {
          return {
            agentId: worker.id,
            content: '',
            metadata: {
              executionTime: 0,
              timestamp: new Date(),
              role: 'worker',
            },
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              code: 'EXECUTION_ERROR',
            },
          };
        }
      });

      const workerOutputs = await Promise.all(workerPromises);
      outputs.push(...workerOutputs);
    } catch (error) {
      const errorOutput: AgentOutput = {
        agentId: coordinator.id,
        content: '',
        metadata: {
          executionTime: 0,
          timestamp: new Date(),
          role: 'coordinator',
        },
        error: {
          message: error instanceof Error ? error.message : 'Coordinator failed',
          code: 'EXECUTION_ERROR',
        },
      };

      outputs.push(errorOutput);
    }

    return outputs;
  }

  /**
   * Validate agent outputs
   */
  private async validateOutputs(
    outputs: AgentOutput[],
    validators: Array<{ validate: (output: AgentOutput) => Promise<boolean> }>,
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
