/**
 * AI Development System for Political Sphere
 *
 * Enterprise-grade AI orchestration with governance, validation, observability,
 * accessibility, and privacy compliance.
 *
 * @packageDocumentation
 * @module @political-sphere/ai-system
 */

// Core orchestration (existing lightweight system)
import type {
  Governance,
  Message,
  Observability,
  OrchestrationContext,
  OrchestrationResult,
  Orchestrator,
  OrchestratorInit,
  Validators,
} from './types';

// Validation system
export * from './validation';

// Governance system
export * from './governance';

// Observability system
export * from './observability';

// Accessibility system
export * from './accessibility';

// Privacy system
export * from './privacy';

// Patterns not needed - removed

/**
 * createOrchestrator
 * Creates a normalized orchestrator instance for a given pattern.
 *
 * Example:
 * const orchestrator = createOrchestrator({
 *   pattern: 'concurrent',
 *   agents: [agentA, agentB],
 * });
 * const result = await orchestrator.run([{ role: 'user', content: 'Hi' }]);
 */
export function createOrchestrator(init: OrchestratorInit): Orchestrator {
  const { pattern, agents, config, governance, validators, observability, memory } = init;

  async function run(
    messages: Message[],
    ctx?: Partial<OrchestrationContext>
  ): Promise<OrchestrationResult> {
    const runId = String(ctx?.runId ?? cryptoRandomId());
    const mergedCtx: OrchestrationContext = {
      runId,
      bag: ctx?.bag ?? {},
      observability: ctx?.observability ?? observability,
      governance: ctx?.governance ?? governance,
      validators: ctx?.validators ?? validators,
      config: { ...(config ?? {}), ...(ctx?.config ?? {}) },
    };

    const obs = mergedCtx.observability;
    try {
      // Load memory if present and merge with input
      let startingTranscript = messages;
      if (memory) {
        const prior = await memory.loadTranscript(runId);
        startingTranscript = [...prior, ...messages];
      }
      await obs?.onStart?.({
        runId,
        pattern,
        agents: agents.map(a => a.id),
        input: startingTranscript,
        config: mergedCtx.config,
      });

      // Pre-input validation/policies
      const preInputValid = await import('./validation/validators').then(m =>
        m.runValidators(
          startingTranscript,
          'input',
          mergedCtx.validators?.input ??
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            [require('./validation/validators').lengthValidator?.(4096)].filter(Boolean)
        )
      );
      if (!preInputValid.ok) {
        const result: OrchestrationResult = {
          transcript: [],
          completed: false,
          metadata: { validation: preInputValid },
        };
        await obs?.onEnd?.({ runId, result });
        return result;
      }
      // Default governance if none supplied
      const policies = mergedCtx.governance?.policies?.length
        ? mergedCtx.governance.policies
        : [(await import('./governance/defaults')).defaultSafetyPolicy()];
      const gov = await import('./governance').then(m =>
        m.enforcePolicies(policies, {
          runId,
          messages: startingTranscript,
          stage: 'pre-input',
          bag: mergedCtx.bag,
        })
      );
      if (!gov.ok) {
        const result: OrchestrationResult = {
          transcript: [],
          completed: false,
          metadata: { governance: gov },
        };
        await obs?.onEnd?.({ runId, result });
        return result;
      }

      // Patterns not supported
      throw new Error('Orchestration patterns are not implemented.');
    } catch (error) {
      await obs?.onError?.({ runId, error, stage: 'orchestrator.run' });
      return { transcript: [], completed: false, metadata: { error } };
    }
  }

  return { run };
}
// Pattern interfaces removed as patterns are not needed

/**
 * withObservability - wraps an Orchestrator to inject/override observability hooks.
 */
export function withObservability(
  orchestrator: Orchestrator,
  observability: Observability
): Orchestrator {
  return {
    async run(messages: Message[], ctx?: Partial<OrchestrationContext>) {
      const runId = String(ctx?.runId ?? cryptoRandomId());
      return orchestrator.run(messages, { ...ctx, runId, observability });
    },
  };
}

/**
 * composePolicies - helper to construct a Governance object.
 */
export function composePolicies(...policies: Governance['policies']): Governance {
  return { policies: policies.flat() };
}

/**
 * composeValidators - helper to construct Validators.
 */
export function composeValidators(
  input?: Validators['input'],
  output?: Validators['output']
): Validators {
  return { input, output };
}

/** Simple random id for correlation. */
function cryptoRandomId(): string {
  const cryptoGlobal = (
    globalThis as unknown as {
      crypto?: { getRandomValues?: (arr: Uint32Array) => Uint32Array };
    }
  ).crypto;
  const rnd = cryptoGlobal?.getRandomValues?.(new Uint32Array(4));
  if (rnd)
    return Array.from(rnd)
      .map(n => n.toString(16))
      .join('');
  // Fallback
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}

// Re-exports to improve DX and Copilot suggestions
export * as governance from './governance';
export * as memory from './memory';
export * as nlp from './nlp';
// Re-export common top-level helpers for convenience
export { nlpService } from './nlp';
export * as observability from './observability';
export * as orchestration from './orchestration';
export * as providers from './providers/mock';
export * as tools from './tools';
export * as builtinTools from './tools/builtins';
export * as validation from './validation/validators';

export type { Agent } from './types/index';

export type {
  Governance,
  Message,
  Observability,
  OrchestrationContext,
  OrchestrationResult,
  Validators,
} from './types';

export { defineAgent } from './types';
