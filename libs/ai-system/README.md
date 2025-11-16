# Political Sphere AI Development System

A comprehensive, enterprise-grade AI orchestration system with built-in governance, validation, observability, accessibility, and privacy compliance.

## 📚 Documentation

- **[Usage Guide](./USAGE-GUIDE.md)** - Complete guide with examples and best practices
- **[Architecture](./ARCHITECTURE.md)** - Detailed 6-layer architecture documentation
- **[Quick Start](./QUICKSTART.md)** - Get started in 5 minutes
- **[Examples](./examples/)** - Working code examples

## Overview

This library provides a **6-layer architecture** for building production-ready AI systems that meet the highest standards of security, accessibility, neutrality, and privacy:

1. **Orchestration** - Multi-agent workflow patterns (Semantic Kernel-inspired)
2. **Validation** - 3-tier validation gates (Constitutional, Mandatory, Best-practice)
3. **Governance** - NIST AI RMF 1.0 compliance framework
4. **Observability** - OpenTelemetry-compatible tracing, metrics, and logging
5. **Accessibility** - WCAG 2.2 AA validation and testing
6. **Privacy** - GDPR compliance (DSAR, consent, retention, breach notification)

### Core Principles

- **Zero-budget**: Pure TypeScript/JavaScript, no paid dependencies
- **Political neutrality**: Constitutional-tier enforcement (bias threshold < 0.1)
- **Security-first**: OWASP ASVS validation at every layer
- **Privacy by design**: GDPR compliance built-in (30-day DSAR, 72-hour breach notification)
- **Accessibility mandatory**: WCAG 2.2 AA+ with automated and manual testing
- **Observable by default**: OpenTelemetry traces, SLI/SLO metrics, structured logs

## Directory Identity

**Directory Name:** ai-system

**Classification:** AI core infrastructure

**Criticality:** High (core AI functionality with governance)

**Risk Level:** Critical (AI safety, political neutrality, GDPR compliance)

**Volatility:** Moderately stable

**Required Skill Levels:** Expert (AI, TypeScript)

**Required AI Personas:** Governance-focused, security-aware

**Access/Permission Restrictions:** Governance review required for changes.

**Sensitive Areas:** Governance policies, bias monitoring.

## 4. Dependencies, Interfaces, & Integration Contracts

**Internal Dependencies:** None (dependency-light)

**External Dependencies:** None (mock provider default)

**Upstream:** Used by apps/ for AI features

**Downstream:** Integrates with AI providers

**Integration Expectations:** Import via Nx, configure orchestrators.

**Public Interfaces:** defineAgent, createOrchestrator APIs

**Contracts:** Message format standards

**Data Flows:** User input → orchestrator → agents → tools → response

**Assumptions:** TypeScript environment

**Volatile Dependencies:** AI provider APIs

## 5. Operational Standards, Practices, & Tooling

**Languages:** TypeScript (strict mode)

**Conventions:** JSDoc comments, async/await, functional patterns

**Operational Rules:** Governance-first, test validators, log all interactions

**Tooling:** Nx, Vitest, TypeScript

**Code Quality:** 90% coverage, strict typing

**Tests:** Unit, integration, governance tests

**Logging:** Structured JSON logs

**Error Handling:** Early termination on violations

**Performance:** Efficient orchestration

**Patterns:** Agent pattern, observer pattern

**References:** docs/07-ai-and-simulation/, ADRs

## 6. Future Direction, Roadmap, & Definition of Done

**Long-term Purpose:** Comprehensive AI governance platform.

**Roadmap:** Add multimodal support, advanced governance.

**Definition of Done:** All governance tests pass, 90% coverage.

**Missing Components:** Some tool integrations.

**Upcoming Integrations:** External providers.

**Test Coverage Goals:** 95%

**Automation Needs:** Governance checks

**Upstream Work:** Update apps/

**Risks/Blockers:** AI safety concerns

## 7. Assumptions, Constraints, & Architectural Guarantees

**Assumptions:** TypeScript strict, async environments.

**Constraints:** No external deps by default.

**Guarantees:** Governance enforcement, type safety.

**Forbidden Patterns:** Direct API calls without governance

## 8. Common Pitfalls, Anti-Patterns, & Lessons Learned

**Pitfalls:** Skipping validators.

**Anti-Patterns:** Ungoverned AI calls.

**Misunderstandings:** Assuming safety.

**Failure Modes:** Governance bypasses.

**Warnings:** Bias risks.

**Best Practices:** Always use orchestrators, test governance.

## 9. Maintenance, Ownership, & Review Cycle

**Ownership:** AI governance team.

**Review Processes:** Security and governance review.

**Review Cadence:** On changes, quarterly audits.

**Refactoring:** With governance updates.

**Escalation:** To CTO for safety issues.

## Features

- **Orchestration patterns**: concurrent, handoff (router), group-chat (facilitator)
- **Safety rails**: governance policies and validators with early termination
- **Observability hooks**: onStart, onMessage, onError, onEnd
- **Memory abstraction**: pluggable stores, in-memory default
- **Tools**: registry and execution; built-ins and examples
- **Mock provider**: deterministic, no paid APIs required

## Quickstart

### Define an agent

```ts
import { defineAgent, createOrchestrator } from './src';

/**
 * Define a simple echo agent that responds with prefixed content
 * @param messages - Array of chat messages
 * @returns Promise resolving to agent response
 */
const agent = defineAgent({
  id: 'echo',
  async respond(messages: ChatMessage[]): Promise<AgentResponse> {
    const last = messages[messages.length - 1];
    return {
      message: {
        role: 'assistant',
        content: `echo: ${last?.content ?? ''}`
      }
    };
  },
});

/**
 * Create orchestrator with concurrent pattern
 * @param agents - Array of defined agents
 */
const orchestrator = createOrchestrator({
  pattern: 'concurrent',
  agents: [agent]
});

/**
 * Run orchestration with user message
 * @param messages - Initial conversation messages
 * @returns Promise resolving to orchestration result
 */
const result = await orchestrator.run([{
  role: 'user',
  content: 'Hello'
}]);
```

## Examples

- `libs/ai-system/examples/basic.ts` - Basic agent definition
- `libs/ai-system/examples/group-chat.ts` - Multi-agent conversation
- `libs/ai-system/examples/tools.ts` - Tool usage and registry

## Extending

### Policies
```ts
const policy = definePolicy((messages, response) => {
  // Policy logic here
  return { valid: true };
});
enforcePolicies([policy], messages, response);
```

### Validators
```ts
const validator = defineValidator((context) => {
  // Validation logic
  return { valid: true, reason: null };
});
await runValidators([validator], context);
```

### Tools
```ts
// Register tool with registry
ToolRegistry.register({
  name: 'my-tool',
  description: 'Tool description',
  execute: async (params) => {
    // Tool execution logic
    return { result: 'output' };
  }
});

// Return tool messages from agents
return {
  message: { role: 'assistant', content: 'Using tool' },
  toolCalls: [{ name: 'my-tool', params: {} }]
};
```

### Providers
```ts
// Use MockProvider for testing
const provider = new MockProvider();

// Or implement custom provider
class CustomProvider implements AIProvider {
  async generate(messages: ChatMessage[]): Promise<AIResponse> {
    // Provider implementation
  }
}
```

## API Reference

### Core Functions

- `defineAgent(config: AgentConfig): Agent` - Create agent instance
- `createOrchestrator(config: OrchestratorConfig): Orchestrator` - Create orchestrator
- `definePolicy(fn: PolicyFunction): Policy` - Define governance policy
- `defineValidator(fn: ValidatorFunction): Validator` - Define validator

### Types

- `ChatMessage` - Message format { role, content, metadata? }
- `AgentResponse` - Agent output { message, toolCalls?, metadata? }
- `OrchestratorResult` - Orchestration output { responses, metadata }

### Patterns

- `concurrent` - All agents respond simultaneously
- `handoff` - Router pattern for agent transitions
- `group-chat` - Facilitated multi-agent conversation

## License

Free to use. Keep it dependency-light and provider-agnostic for local-first development.
