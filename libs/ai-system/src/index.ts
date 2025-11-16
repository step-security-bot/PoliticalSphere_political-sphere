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
  Agent,
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

// Import existing patterns (adapters below normalize the interface)
import * as concurrentPattern from './orchestration/patterns/concurrent';
import * as groupChatPattern from './orchestration/patterns/group-chat';
import * as handoffPattern from './orchestration/patterns/handoff';

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

      // Select pattern implementation
      const impl = selectPattern(pattern);
      const result = await impl.run({ agents, input: startingTranscript, ctx: mergedCtx });

      // Pre-output validation/policies
      const preOutputValid = await import('./validation/validators').then(m =>
        m.runValidators(
          result.output ?? result.transcript[result.transcript.length - 1],
          'output',
          mergedCtx.validators?.output ??
            [require('./validation/validators').lengthValidator?.(4096)].filter(Boolean)
        )
      );
      if (!preOutputValid.ok) {
        const failed: OrchestrationResult = {
          ...result,
          completed: false,
          metadata: { ...(result.metadata ?? {}), validation: preOutputValid },
        };
        await obs?.onEnd?.({ runId, result: failed });
        return failed;
      }
      const govOut = await import('./governance').then(m =>
        m.enforcePolicies(policies, {
          runId,
          messages: result.transcript,
          stage: 'pre-output',
          bag: mergedCtx.bag,
        })
      );
      if (!govOut.ok) {
        const failed: OrchestrationResult = {
          ...result,
          completed: false,
          metadata: { ...(result.metadata ?? {}), governance: govOut },
        };
        await obs?.onEnd?.({ runId, result: failed });
        return failed;
      }

      // Persist transcript to memory if provided
      if (memory) {
        await memory.appendMany?.(runId, result.transcript);
        const max = Number(mergedCtx.config?.memory?.maxMessages ?? 200);
        await memory.truncate?.(runId, max);
      }
      await obs?.onEnd?.({ runId, result });
      return result;
    } catch (error) {
      await obs?.onError?.({ runId, error, stage: 'orchestrator.run' });
      return { transcript: [], completed: false, metadata: { error } };
    }
  }

  return { run };
}

/** Pattern adapter selection. Each pattern module should export a `run` compatible adapter. */
function selectPattern(pattern: OrchestratorInit['pattern']): PatternAdapter {
  switch (pattern) {
    case 'concurrent':
      return normalizePattern(concurrentPattern);
    case 'handoff':
      return normalizePattern(handoffPattern);
    case 'group-chat':
      return normalizePattern(groupChatPattern);
    default:
      throw new Error(`Unknown pattern: ${pattern as string}`);
  }
}

/**
 * Pattern adapter interface and normalizer.
 * This provides forward compatibility even if existing modules have different shapes.
 */
interface PatternAdapter {
  run(args: {
    agents: Agent[];
    input: Message[];
    ctx: OrchestrationContext;
  }): Promise<OrchestrationResult>;
}

interface PatternModule {
  run?: PatternAdapter['run'];
  execute?: PatternAdapter['run'];
  default?: {
    run?: PatternAdapter['run'];
    execute?: PatternAdapter['run'];
  };
}

function normalizePattern(mod: PatternModule): PatternAdapter {
  // If module already exposes a compatible run, return it.
  if (typeof mod.run === 'function') {
    return { run: mod.run } as PatternAdapter;
  }

  // Otherwise attempt common fallbacks: default export, class with execute(), etc.
  if (typeof mod.default?.run === 'function') {
    return { run: mod.default.run.bind(mod.default) } as PatternAdapter;
  }
  if (typeof mod.execute === 'function') {
    return { run: mod.execute } as PatternAdapter;
  }
  if (typeof mod.default?.execute === 'function') {
    return { run: mod.default.execute.bind(mod.default) } as PatternAdapter;
  }

  throw new Error('Pattern module does not expose a runnable adapter. Expected run(args)');
}

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
  const rnd = (globalThis.crypto as Crypto | undefined)?.getRandomValues?.(new Uint32Array(4));
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
export * as observability from './observability';
export * as providers from './providers/mock';
export * as tools from './tools';
export * as builtinTools from './tools/builtins';
export * as validation from './validation/validators';

export type {
  Agent,
  Governance,
  Message,
  Observability,
  OrchestrationContext,
  OrchestrationResult,
  Validators,
} from './types';

export { defineAgent } from './types';
