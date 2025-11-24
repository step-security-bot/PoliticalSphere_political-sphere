/**
 * Orchestration Patterns Tests
 *
 * Tests for multi-agent orchestration patterns.
 */

import { describe, expect, it } from 'vitest';
import { OrchestrationEngine } from '../../src/orchestration/engine';
import { InMemoryResponseCache } from '../../src/orchestration/cache';
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

describe('Orchestration Patterns', () => {
  describe('Sequential Pattern', () => {
    it('should execute agents in sequence', async () => {
      const engine = new OrchestrationEngine({ pattern: 'sequential' });
      const agent1 = createMockAgent('Agent1', 'Step 1 complete');
      const agent2 = createMockAgent('Agent2', 'Step 2 complete');

      const result = await engine.execute({
        agents: [agent1, agent2],
        prompt: 'Test query',
        context: {},
      });

      expect(result.success).toBe(true);
      expect(result.outputs.length).toBe(2);
      expect(result.outputs[0].content).toContain('Step 1');
      expect(result.outputs[1].content).toContain('Step 2');
    });

    it('should handle agent errors gracefully', async () => {
      const failingAgent: Agent = {
        id: 'failing-agent',
        name: 'Failing Agent',
        description: 'Agent that fails',
        async execute(_input: AgentInput): Promise<AgentOutput> {
          throw new Error('Agent failed');
        },
      };

      const engine = new OrchestrationEngine({ pattern: 'sequential' });
      const result = await engine.execute({
        agents: [failingAgent],
        prompt: 'Test query',
      });

      expect(result.success).toBe(false);
      expect(result.outputs.length).toBe(1);
      expect(result.outputs[0].error).toBeDefined();
    });
  });

  describe('Concurrent Pattern', () => {
    it('should execute agents concurrently', async () => {
      const engine = new OrchestrationEngine({ pattern: 'concurrent' });
      const agent1 = createMockAgent('Agent1', 'Concurrent 1');
      const agent2 = createMockAgent('Agent2', 'Concurrent 2');

      const result = await engine.execute({
        agents: [agent1, agent2],
        prompt: 'Test concurrent',
      });

      expect(result.success).toBe(true);
      expect(result.outputs.length).toBe(2);
      expect(result.outputs.some(o => o.content.includes('Concurrent 1'))).toBe(true);
      expect(result.outputs.some(o => o.content.includes('Concurrent 2'))).toBe(true);
    });
  });

  describe('Handoff Pattern', () => {
    it('should execute agents in handoff sequence', async () => {
      const engine = new OrchestrationEngine({ pattern: 'handoff' });
      const agent1 = createMockAgent('Agent1', 'Handoff 1');
      const agent2 = createMockAgent('Agent2', 'Handoff 2');

      const result = await engine.execute({
        agents: [agent1, agent2],
        prompt: 'Test handoff',
      });

      expect(result.success).toBe(true);
      expect(result.outputs.length).toBe(2);
    });
  });

  describe('Group Chat Pattern', () => {
    it('should execute agents in group chat', async () => {
      const engine = new OrchestrationEngine({ pattern: 'group-chat' });
      const agent1 = createMockAgent('Agent1', 'Group 1');
      const agent2 = createMockAgent('Agent2', 'Group 2');

      const result = await engine.execute({
        agents: [agent1, agent2],
        prompt: 'Test group chat',
      });

      expect(result.success).toBe(true);
      expect(result.outputs.length).toBeGreaterThan(0);
    });
  });

  describe('Magentic Pattern', () => {
    it('should execute agents in magentic pattern', async () => {
      const coordinator = createMockAgent('Coordinator', 'Plan: Do task');
      const worker1 = createMockAgent('Worker1', 'Task done');
      const worker2 = createMockAgent('Worker2', 'Task done');

      const engine = new OrchestrationEngine({ pattern: 'magentic' });
      const result = await engine.execute({
        agents: [coordinator, worker1, worker2],
        prompt: 'Test magentic',
      });

      expect(result.success).toBe(true);
      expect(result.outputs.length).toBe(3);
    });

    it('should fail with insufficient agents for magentic', async () => {
      const engine = new OrchestrationEngine({ pattern: 'magentic' });
      const result = await engine.execute({
        agents: [createMockAgent('Agent1', 'Test')],
        prompt: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Magentic pattern requires at least 2 agents');
    });
  });

  describe('Engine Configuration', () => {
    it('should set and get pattern', () => {
      const engine = new OrchestrationEngine({ pattern: 'sequential' });

      engine.setPattern('concurrent');
      expect(engine.getConfig().pattern).toBe('concurrent');
    });

    it('should generate unique trace IDs', () => {
      const engine = new OrchestrationEngine();
      const traceId1 = (engine as any).generateTraceId();
      const traceId2 = (engine as any).generateTraceId();

      expect(traceId1).toMatch(/^trace-\d+-[a-z0-9]+$/);
      expect(traceId2).toMatch(/^trace-\d+-[a-z0-9]+$/);
      expect(traceId1).not.toBe(traceId2);
    });

    it('should use provided trace ID', async () => {
      const engine = new OrchestrationEngine({ pattern: 'sequential' });
      const agent = createMockAgent('Agent1', 'Test');

      const result = await engine.execute({
        agents: [agent],
        prompt: 'Test',
        traceId: 'custom-trace-123',
      });

      expect(result.success).toBe(true);
    });

    it('should handle validators', async () => {
      const engine = new OrchestrationEngine({ pattern: 'sequential' });
      const agent = createMockAgent('Agent1', 'Test output');

      const validator = {
        validate: async (output: AgentOutput) => output.content === 'Test output',
      };

      const result = await engine.execute({
        agents: [agent],
        prompt: 'Test',
        validators: [validator],
      });

      expect(result.success).toBe(true);
      expect(result.validationResults).toBeDefined();
      expect(result.validationResults?.length).toBe(1);
    });

    it('should fail validation', async () => {
      const engine = new OrchestrationEngine({ pattern: 'sequential' });
      const agent = createMockAgent('Agent1', 'Wrong output');

      const validator = {
        validate: async (output: AgentOutput) => output.content === 'Expected output',
      };

      const result = await engine.execute({
        agents: [agent],
        prompt: 'Test',
        validators: [validator],
      });

      expect(result.success).toBe(false);
      expect(result.validationResults?.[0].passed).toBe(false);
    });

    it('should handle empty agents array', async () => {
      const engine = new OrchestrationEngine();

      const result = await engine.execute({
        agents: [],
        prompt: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('At least one agent is required');
    });

    it('should handle unsupported pattern', async () => {
      const engine = new OrchestrationEngine({ pattern: 'unsupported' as any });
      const agent = createMockAgent('Agent1', 'Test');

      const result = await engine.execute({
        agents: [agent],
        prompt: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Pattern 'unsupported' not implemented");
    });
  });

  describe('Caching', () => {
    it('should return cached result and avoid re-execution', async () => {
      let callCount = 0;
      const agent: Agent = {
        id: 'CachingAgent',
        name: 'Caching Agent',
        description: 'Agent used to verify caching',
        async execute(_input: AgentInput): Promise<AgentOutput> {
          callCount += 1;
          return {
            agentId: 'CachingAgent',
            content: `Call #${callCount}`,
            metadata: {
              executionTime: 5,
              timestamp: new Date(),
            },
          };
        },
      };

      const engine = new OrchestrationEngine({ pattern: 'sequential' });
      const cache = new InMemoryResponseCache();

      const first = await engine.execute({
        agents: [agent],
        prompt: 'Cache me',
        cache,
        cacheKey: 'cache-test',
      });
      const second = await engine.execute({
        agents: [agent],
        prompt: 'Cache me',
        cache,
        cacheKey: 'cache-test',
      });

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(second.cacheHit).toBe(true);
      expect(callCount).toBe(1);
      expect(second.outputs[0].content).toBe(first.outputs[0].content);
    });
  });
});
