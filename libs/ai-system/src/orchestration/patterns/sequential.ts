import type { Agent, AgentInput, AgentOutput } from '../../types';

/**
 * Sequential orchestration pattern: runs agents one after another,
 * passing previous outputs as context to subsequent agents.
 */
export class SequentialPattern {
  async execute(agents: Agent[], input: AgentInput): Promise<AgentOutput[]> {
    const outputs: AgentOutput[] = [];
    const start = Date.now();

    for (const agent of agents) {
      const agentStart = Date.now();
      const result = await agent.execute({
        ...input,
        previousOutputs: [...outputs],
      });

      // Ensure required output fields
      const output: AgentOutput = {
        ...result,
        agentId: result.agentId || agent.id,
        metadata: {
          executionTime: Date.now() - agentStart,
          timestamp: result.metadata?.timestamp ?? new Date(),
          model: result.metadata?.model,
          tokenUsage: result.metadata?.tokenUsage,
        },
      };

      outputs.push(output);
    }

    // Attach total execution time to the last output for reference
    if (outputs.length > 0) {
      outputs[outputs.length - 1].metadata.executionTime = Date.now() - start;
    }

    return outputs;
  }
}
