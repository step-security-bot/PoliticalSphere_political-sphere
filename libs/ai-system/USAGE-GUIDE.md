# AI System Usage Guide

**Version:** 1.0.0  
**Last Updated:** 2025-11-14  
**Status:** Production Ready

## Quick Start

### Installation

The AI system is available as a library within the Political Sphere monorepo:

```typescript
import { createOrchestrator, defineAgent } from '@political-sphere/ai-system';
import { MockProvider } from '@political-sphere/ai-system/providers/mock';
```

### Basic Example

```typescript
import { createOrchestrator, defineAgent } from '@political-sphere/ai-system';
import { MockProvider } from '@political-sphere/ai-system/providers/mock';

// Define an agent
const analysisAgent = defineAgent({
  id: 'analyzer',
  name: 'Policy Analyzer',
  description: 'Analyzes political policies for neutrality',
  async respond(messages, ctx) {
    const provider = new MockProvider({ name: 'analyzer' });
    const response = await provider.respond(messages);
    return {
      message: {
        role: 'assistant',
        content: response.content,
      },
    };
  },
});

// Create orchestrator
const orchestrator = createOrchestrator({
  pattern: 'concurrent',
  agents: [analysisAgent],
});

// Run the orchestrator
const result = await orchestrator.run([
  { role: 'user', content: 'Analyze this policy proposal...' },
]);

console.log(result.output?.content);
```

## Core Concepts

### 1. Agents

Agents are the fundamental units of AI functionality. Each agent:

- Has a unique ID and optional name/description
- Responds to message sequences
- Returns messages and optional tool calls

```typescript
interface Agent {
  id: string;
  name?: string;
  description?: string;
  respond(messages: Message[], ctx: OrchestrationContext): Promise<AgentResult>;
}
```

### 2. Orchestrators

Orchestrators coordinate multiple agents using different patterns:

- **Concurrent**: All agents run in parallel
- **Handoff**: Sequential agent execution with context passing
- **Group Chat**: Dynamic agent selection based on conversation

```typescript
const orchestrator = createOrchestrator({
  pattern: 'handoff', // or 'concurrent' or 'group-chat'
  agents: [agent1, agent2],
  config: {
    maxTurns: 10,
  },
});
```

### 3. Governance

Governance policies enforce constitutional, security, and quality requirements:

```typescript
import { PoliticalNeutralityEnforcer } from '@political-sphere/ai-system/governance';

const neutralityEnforcer = new PoliticalNeutralityEnforcer();

const orchestrator = createOrchestrator({
  pattern: 'concurrent',
  agents: [agent],
  governance: {
    policies: [
      async (ctx) => {
        const lastMessage = ctx.messages[ctx.messages.length - 1];
        const result = await neutralityEnforcer.checkNeutrality(lastMessage.content);
        
        if (!result.isNeutral) {
          return {
            ok: false,
            violations: [{
              code: 'POLITICAL_BIAS',
              message: `Bias score ${result.biasScore} exceeds threshold`,
            }],
          };
        }
        
        return { ok: true };
      },
    ],
  },
});
```

### 4. Validation

Validators check inputs and outputs against rules:

```typescript
import { createValidator } from '@political-sphere/ai-system/validation';

const orchestrator = createOrchestrator({
  pattern: 'concurrent',
  agents: [agent],
  validators: {
    input: [
      async (value, ctx) => {
        if (typeof value !== 'string' || value.length === 0) {
          return {
            ok: false,
            errors: [{ message: 'Input must be non-empty string' }],
          };
        }
        return { ok: true };
      },
    ],
    output: [
      async (value, ctx) => {
        // Validate output format
        return { ok: true };
      },
    ],
  },
});
```

### 5. Observability

Track execution with structured logging and metrics:

```typescript
import { AILogger } from '@political-sphere/ai-system/observability';

const logger = new AILogger('my-orchestrator');

const orchestrator = createOrchestrator({
  pattern: 'concurrent',
  agents: [agent],
  observability: {
    onStart: async (event) => {
      logger.info('Orchestration started', {
        runId: event.runId,
        pattern: event.pattern,
        agentCount: event.agents.length,
      });
    },
    onMessage: async (event) => {
      logger.debug('Message received', {
        runId: event.runId,
        from: event.from,
        role: event.message.role,
      });
    },
    onEnd: async (event) => {
      logger.info('Orchestration completed', {
        runId: event.runId,
        messageCount: event.result.transcript.length,
        completed: event.result.completed,
      });
    },
    onError: async (event) => {
      logger.error('Orchestration error', {
        runId: event.runId,
        error: event.error,
        stage: event.stage,
      });
    },
  },
});
```

## Advanced Features

### NIST AI RMF Compliance

The AI system implements the NIST AI Risk Management Framework:

```typescript
import { NISTAIRMFOrchestrator } from '@political-sphere/ai-system/governance';

const rmf = new NISTAIRMFOrchestrator();

// Register an AI system
const system = {
  id: 'policy-analyzer',
  name: 'Policy Analysis System',
  description: 'Analyzes political policies for neutrality and fairness',
  riskLevel: 'high' as const,
  model: {
    name: 'policy-analyzer-v1',
    version: '1.0.0',
    provider: 'internal',
  },
  registeredAt: new Date(),
};

rmf.registerSystem(system);

// Perform compliance assessment
const assessment = await rmf.performComplianceAssessment(system);
console.log(assessment);
```

### Bias Monitoring

Continuously monitor AI outputs for bias:

```typescript
import { BiasMonitoringSystem } from '@political-sphere/ai-system/governance';

const biasMonitor = new BiasMonitoringSystem({
  threshold: 0.1, // Constitutional threshold
  alertLevel: 'error',
});

// Record bias metric
biasMonitor.recordMetric({
  systemId: 'content-moderator',
  biasScore: 0.05,
  sampleSize: 1000,
  demographicSlice: 'overall',
});

// Get bias trends
const trends = biasMonitor.getBiasTrend('content-moderator', 7); // Last 7 days
console.log('Trend:', trends.trend); // 'improving', 'worsening', or 'stable'
```

### WCAG Accessibility Validation

Validate UI content for accessibility:

```typescript
import { WCAGValidator } from '@political-sphere/ai-system/accessibility';

const validator = new WCAGValidator();

const result = await validator.validate({
  html: '<button>Submit</button>',
  images: [{ src: '/logo.png', alt: '' }], // Missing alt text
});

if (!result.passed) {
  console.log('Accessibility violations:', result.violations);
  // [{ criterion: '1.1.1', level: 'A', message: 'Images must have alt text' }]
}
```

### GDPR Compliance

Handle data subject access requests:

```typescript
import { DSARHandler } from '@political-sphere/ai-system/privacy';

const dsarHandler = new DSARHandler();

// Handle access request
const accessRequest = dsarHandler.createRequest({
  type: 'access',
  userId: 'user-123',
  email: 'user@example.com',
});

// Process request with data fetcher
const userData = await dsarHandler.processRequest(accessRequest.requestId, async (userId) => {
  return {
    profile: { name: 'John Doe', email: 'user@example.com' },
    preferences: { theme: 'dark', language: 'en' },
    // ... other user data
  };
});

console.log('User data:', userData);
```

## Testing

### Unit Testing Agents

```typescript
import { describe, it, expect } from 'vitest';
import { defineAgent } from '@political-sphere/ai-system';

describe('My Agent', () => {
  it('should respond to user messages', async () => {
    const agent = defineAgent({
      id: 'test-agent',
      async respond(messages, ctx) {
        return {
          message: {
            role: 'assistant',
            content: 'Test response',
          },
        };
      },
    });

    const result = await agent.respond(
      [{ role: 'user', content: 'Hello' }],
      { runId: 'test-123' } as any
    );

    expect(result.message.content).toBe('Test response');
  });
});
```

### Integration Testing

```typescript
import { createOrchestrator, defineAgent } from '@political-sphere/ai-system';

describe('Orchestration', () => {
  it('should coordinate multiple agents', async () => {
    const agent1 = defineAgent({
      id: 'agent-1',
      async respond() {
        return { message: { role: 'assistant', content: 'Response 1' } };
      },
    });

    const agent2 = defineAgent({
      id: 'agent-2',
      async respond() {
        return { message: { role: 'assistant', content: 'Response 2' } };
      },
    });

    const orchestrator = createOrchestrator({
      pattern: 'concurrent',
      agents: [agent1, agent2],
    });

    const result = await orchestrator.run([
      { role: 'user', content: 'Test input' },
    ]);

    expect(result.completed).toBe(true);
    expect(result.transcript.length).toBeGreaterThan(0);
  });
});
```

## Best Practices

### 1. Always Use Governance

Never deploy AI systems without governance policies:

```typescript
// ❌ Bad: No governance
const orchestrator = createOrchestrator({
  pattern: 'concurrent',
  agents: [agent],
});

// ✅ Good: With governance
const orchestrator = createOrchestrator({
  pattern: 'concurrent',
  agents: [agent],
  governance: {
    policies: [neutralityPolicy, securityPolicy],
  },
});
```

### 2. Implement Observability

Always include observability for production systems:

```typescript
import { AILogger, AITracer, MetricsCollector } from '@political-sphere/ai-system/observability';

const logger = new AILogger('my-system');
const tracer = new AITracer('my-system');
const metrics = new MetricsCollector('my-system');

const orchestrator = createOrchestrator({
  pattern: 'concurrent',
  agents: [agent],
  observability: {
    onStart: async (event) => {
      const span = tracer.startSpan('orchestration', { runId: event.runId });
      logger.info('Started', event);
    },
    onEnd: async (event) => {
      metrics.recordLatency(Date.now() - startTime);
      logger.info('Completed', event);
    },
  },
});
```

### 3. Validate All Inputs

Always validate user inputs:

```typescript
import { z } from 'zod';

const inputSchema = z.object({
  content: z.string().min(1).max(5000),
  metadata: z.record(z.unknown()).optional(),
});

const orchestrator = createOrchestrator({
  pattern: 'concurrent',
  agents: [agent],
  validators: {
    input: [
      async (value) => {
        const result = inputSchema.safeParse(value);
        if (!result.success) {
          return {
            ok: false,
            errors: result.error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          };
        }
        return { ok: true };
      },
    ],
  },
});
```

### 4. Monitor Bias Continuously

Implement continuous bias monitoring:

```typescript
import { BiasMonitoringSystem } from '@political-sphere/ai-system/governance';

const biasMonitor = new BiasMonitoringSystem({ threshold: 0.1 });

// After each AI interaction
const biasScore = calculateBiasScore(output);
biasMonitor.recordMetric({
  systemId: 'my-system',
  biasScore,
  sampleSize: 1,
  demographicSlice: 'overall',
});

// Check for alerts
const alerts = biasMonitor.getActiveAlerts('my-system');
if (alerts.length > 0) {
  logger.error('Bias alerts detected', { alerts });
  // Take corrective action
}
```

### 5. Test Accessibility

Always test UI components for WCAG compliance:

```typescript
import { WCAGValidator } from '@political-sphere/ai-system/accessibility';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

describe('MyComponent', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Troubleshooting

### Common Issues

#### Issue: "Pattern module does not expose a runnable adapter"

**Solution**: Ensure your pattern module exports a `run` function:

```typescript
// pattern.ts
export async function run(args: {
  agents: Agent[];
  input: Message[];
  ctx: OrchestrationContext;
}): Promise<OrchestrationResult> {
  // Implementation
}
```

#### Issue: "Governance policy violations"

**Solution**: Check policy results and fix violations:

```typescript
const result = await orchestrator.run(messages);
if (!result.completed) {
  const violations = result.metadata?.violations;
  console.error('Policy violations:', violations);
}
```

#### Issue: "High bias scores"

**Solution**: Review and retrain your AI models, check training data:

```typescript
const biasReport = biasMonitor.generateReport('my-system');
console.log('Bias metrics:', biasReport);

// If bias is too high, implement mitigations
if (biasReport.currentBias > 0.1) {
  // Add bias correction
  // Retrain with balanced data
  // Apply post-processing
}
```

## Additional Resources

- **API Documentation**: See JSDoc comments in source code
- **Examples**: Check `/libs/ai-system/examples/` directory
- **Tests**: Review `/libs/ai-system/tests/` for usage patterns
- **Governance**: See `/docs/07-ai-and-simulation/ai-governance.md`
- **Architecture**: See `/docs/04-architecture/` for system design

## Support

For questions or issues:

1. Check this guide and examples
2. Review test files for usage patterns
3. Consult the governance documentation
4. Open an issue in the repository

---

**Remember**: All AI systems must comply with:
- Political neutrality (bias < 0.1)
- WCAG 2.2 AA accessibility
- GDPR privacy requirements
- OWASP security standards
- NIST AI RMF governance
