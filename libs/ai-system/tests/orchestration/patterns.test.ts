/**
 * Orchestration Patterns Tests
 *
 * Tests for multi-agent orchestration patterns.
 */

import { describe, expect, it } from 'vitest';
import { SequentialPattern } from '../../src/orchestration/patterns/sequential';
import type { Agent, AgentInput, AgentOutput } from '../../src/types';

// Mock agent for testing
const createMockAgent = (name: string, content: string): Agent => ({
  id: name,
  name,
  description: `Test agent ${name}`,
  async execute(_input: AgentInput): Promise<AgentOutput> {
    return {
      agentId: name,
      content,
      metadata: {
        executionTime: 10,
        timestamp: new Date(),
      },
    };
  },
});

describe('Sequential Pattern', () => {
  it('should execute agents in sequence', async () => {
    const pattern = new SequentialPattern();
    const agent1 = createMockAgent('Agent1', 'Step 1 complete');
    const agent2 = createMockAgent('Agent2', 'Step 2 complete');

    const input: AgentInput = {
      prompt: 'Test query',
      context: {},
    };

    const result = await pattern.execute([agent1, agent2], input);

    expect(result.length).toBe(2);
    expect(result[0].content).toContain('Step 1');
    expect(result[1].content).toContain('Step 2');
  });
});
