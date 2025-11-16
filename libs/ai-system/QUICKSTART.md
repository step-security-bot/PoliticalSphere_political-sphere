# Quick Start Guide

Get started with the Political Sphere AI Development System in 5 minutes.

## Installation

```bash
# This library is part of the Political Sphere monorepo
# Import from the library path:
import { ... } from '@political-sphere/ai-system';
```

## Basic Example: Hello World

```typescript
import { createOrchestrator, defineAgent } from '@political-sphere/ai-system';

// 1. Define an AI agent
const agent = defineAgent({
  id: 'hello-agent',
  name: 'Hello Agent',
  description: 'A friendly greeting agent',
  model: 'gpt-4',
  systemPrompt: 'You are a friendly assistant.',
});

// 2. Create orchestrator
const orchestrator = createOrchestrator({
  pattern: 'sequential',
  agents: [agent],
});

// 3. Run
const result = await orchestrator.run([
  { role: 'user', content: 'Say hello!' }
]);

console.log(result.finalMessage.content);
// Output: "Hello! How can I help you today?"
```

## Adding Observability

Track execution with built-in logging, tracing, and metrics:

```typescript
import { createOrchestrator, defineAgent } from '@political-sphere/ai-system';
import { tracer, metrics, logger } from '@political-sphere/ai-system/observability';

const agent = defineAgent({ /* ... */ });

const orchestrator = createOrchestrator({
  pattern: 'sequential',
  agents: [agent],
  observability: {
    onStart: async (ctx) => {
      const spanId = tracer.startSpan('ai-operation', {
        'agent.id': agent.id,
        'run.id': ctx.runId,
      });
      
      logger.info('AI operation started', { runId: ctx.runId, spanId });
    },
    onComplete: async (ctx, result) => {
      metrics.recordLatency('ai-operation', result.durationMs || 0, {
        status: result.success ? 'success' : 'error',
      });
      
      logger.info('AI operation completed', {
        runId: ctx.runId,
        success: result.success,
        duration: result.durationMs,
      });
    },
  },
});
```

## Adding Political Neutrality Validation

Enforce constitutional neutrality requirements:

```typescript
import { createOrchestrator } from '@political-sphere/ai-system';
import { PoliticalNeutralityEnforcer } from '@political-sphere/ai-system/governance';

const orchestrator = createOrchestrator({
  pattern: 'sequential',
  agents: [agent],
  validators: {
    postExecution: async (messages, result) => {
      // Validate output for political neutrality
      const neutralityEnforcer = new PoliticalNeutralityEnforcer();
      const check = await neutralityEnforcer.checkNeutrality(
        result.finalMessage.content
      );
      
      if (!check.passed) {
        throw new Error(
          `Neutrality violation: ${check.biases.map(b => b.description).join(', ')}`
        );
      }
      
      return true;
    },
  },
});
```

## Adding Security Validation

Apply OWASP ASVS security checks:

```typescript
import { mandatoryGates } from '@political-sphere/ai-system/validation';

const securityGate = mandatoryGates.find(g => g.name === 'Security Validation');

const orchestrator = createOrchestrator({
  pattern: 'sequential',
  agents: [agent],
  validators: {
    preExecution: async (messages) => {
      // Validate input before processing
      const result = await securityGate.validate({
        messages,
        requiresAuth: true,
        user: { id: 'user-123', permissions: ['read'] },
      });
      
      if (!result.passed) {
        throw new Error('Security validation failed');
      }
      
      return true;
    },
  },
});
```

## Using NIST AI RMF Governance

Register and govern AI systems:

```typescript
import { NISTAIRMFOrchestrator } from '@political-sphere/ai-system/governance';

const governance = new NISTAIRMFOrchestrator();

// Register your AI system
governance.govern.registerSystem({
  id: 'my-chatbot',
  name: 'Customer Support Chatbot',
  description: 'Assists customers with common questions',
  owner: 'Customer Success Team',
  riskLevel: 'medium',
  model: {
    provider: 'OpenAI',
    version: 'gpt-4-1106',
    type: 'generative',
  },
  dataSources: ['customer-tickets', 'knowledge-base'],
  limitations: ['English only', 'No refund processing'],
  biasMitigations: ['Balanced training data', 'Regular audits'],
  registeredAt: new Date(),
});

// Check if approval is needed
const needsApproval = governance.govern.requiresApproval('my-chatbot', 'speech');

// Measure bias
const biasCheck = await governance.measure.measureBias('my-chatbot', [
  { text: 'Sample output to check for bias' }
]);

if (!biasCheck.passed) {
  console.warn(`Bias detected: ${biasCheck.biasScore}`);
}
```

## Testing Accessibility

Validate WCAG 2.2 AA compliance:

```typescript
import { WCAGValidator } from '@political-sphere/ai-system/accessibility';

const validator = new WCAGValidator();

// Validate HTML output
const html = `
  <button aria-label="Submit form">Submit</button>
`;

const result = await validator.validate(html);

if (!result.passed) {
  console.error('WCAG violations:', result.violations);
} else {
  console.log('Accessibility checks passed!');
}
```

## Handling User Data (GDPR)

Process data subject access requests:

```typescript
import { DSARHandler } from '@political-sphere/ai-system/privacy';

const dsarHandler = new DSARHandler();

// User requests their data
const request = dsarHandler.createRequest(
  'access',
  'user-123',
  'user@example.com',
  'I want a copy of my data'
);

// Process within 30-day SLA
const result = await dsarHandler.processAccessRequest(request.requestId);

if (result.success) {
  // Send data to user
  console.log('User data:', result.data);
}
```

## Managing User Consent

Track and enforce consent:

```typescript
import { ConsentManager, ConsentPurpose } from '@political-sphere/ai-system/privacy';

const consentManager = new ConsentManager();

// Grant consent
consentManager.grantConsent('user-123', ConsentPurpose.ANALYTICS, {
  version: '1.0',
  metadata: { ip: '127.0.0.1' },
});

// Check before processing
if (consentManager.hasConsent('user-123', ConsentPurpose.ANALYTICS)) {
  // Process analytics
}

// Withdraw consent
consentManager.withdrawConsent('user-123', ConsentPurpose.ANALYTICS);
```

## Complete Example

See `examples/complete-system.ts` for a comprehensive example using all 6 layers:

```bash
npm run example:complete-system
```

## Next Steps

- **Read the full README**: `libs/ai-system/README.md`
- **Explore examples**: `libs/ai-system/examples/`
- **Run tests**: `npm test`
- **Review architecture**: `docs/07-ai-and-simulation/ai-development-system-research-and-plan.md`

## Common Patterns

### Multi-Agent Workflow

```typescript
const researchAgent = defineAgent({ /* ... */ });
const analysisAgent = defineAgent({ /* ... */ });
const reviewAgent = defineAgent({ /* ... */ });

const orchestrator = createOrchestrator({
  pattern: 'sequential', // Or 'concurrent', 'handoff', 'group-chat'
  agents: [researchAgent, analysisAgent, reviewAgent],
});
```

### Error Handling

```typescript
try {
  const result = await orchestrator.run(messages);
  
  if (!result.success) {
    console.error('Operation failed:', result.error);
  }
} catch (error) {
  logger.error('Orchestration error', error as Error);
  metrics.recordError('orchestration', 'execution-failure');
}
```

### Custom Validators

```typescript
import { ValidationGate, ValidationFinding } from '@political-sphere/ai-system/validation';

const customGate = new ValidationGate({
  name: 'My Custom Gate',
  tier: 1, // Mandatory
  description: 'Custom validation logic',
  validators: [
    async (context): Promise<ValidationFinding[]> => {
      const findings: ValidationFinding[] = [];
      
      // Your validation logic
      if (/* condition */) {
        findings.push({
          severity: 'error',
          code: 'CUSTOM_001',
          message: 'Custom validation failed',
          details: { /* ... */ },
        });
      }
      
      return findings;
    },
  ],
});
```

## Troubleshooting

**Q: How do I enable distributed tracing?**

Set the OpenTelemetry endpoint:
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

**Q: How do I adjust bias thresholds?**

Configure via environment:
```bash
export NIST_AI_RMF_BIAS_THRESHOLD=0.1
export POLITICAL_NEUTRALITY_THRESHOLD=0.9
```

**Q: How do I handle DSAR requests in production?**

Implement data retrieval and deletion in the DSAR handler:
```typescript
class CustomDSARHandler extends DSARHandler {
  protected async retrieveUserData(userId: string): Promise<Record<string, unknown>> {
    // Fetch from your databases
    return { /* user data */ };
  }
  
  protected async deleteUserData(userId: string): Promise<void> {
    // Delete from your databases
  }
}
```

## Support

- **Documentation**: `docs/`
- **Examples**: `examples/`
- **Tests**: Run `npm test` to see usage patterns
- **Issues**: Open a GitHub issue

## License

MIT - See LICENSE for details.
