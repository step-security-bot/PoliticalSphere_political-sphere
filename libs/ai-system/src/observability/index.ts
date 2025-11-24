import { Message, OrchestrationResult } from '../types';

/**
 * Tracer interface abstracts the tracing implementation used by the AI system.
 * Implementations can map to OpenTelemetry, Honeycomb, or a no-op tracer for tests.
 */
export interface Tracer {
  startSpan(name: string, attributes?: Record<string, unknown>): Span;
}

/**
 * Span represents a trace span provided by the underlying tracing backend.
 */
export interface Span {
  setAttribute(key: string, value: unknown): void;
  end(): void;
}

class NoopSpan implements Span {
  setAttribute(): void {}
  end(): void {}
}

/**
 * No-operation tracer implementation that provides empty span objects.
 * Useful for testing, development environments, or when tracing is disabled.
 * All tracing operations are no-ops and have no performance impact.
 */
/**
 * No-op tracer implementation used for environments where tracing is disabled (e.g., tests)
 */
export class NoopTracer implements Tracer {
  startSpan(): Span {
    return new NoopSpan();
  }
}

export const tracer: Tracer = new NoopTracer();

/**
 * Observability hooks for orchestration. These are thin and framework-agnostic so they
 * can be adapted to console logging, OpenTelemetry, etc.
 */
/**
 * Observability hooks that the orchestration engine will call for lifecycle events.
 * Implementations can forward metrics and logs to external systems or a console for debugging.
 */
export interface Observability {
  onStart?(event: {
    runId: string;
    pattern: string;
    agents: string[];
    input: Message[];
    config?: Record<string, unknown>;
  }): void | Promise<void>;
  onMessage?(event: {
    runId: string;
    from: string;
    message: Message;
    stage?: string;
  }): void | Promise<void>;
  onError?(event: { runId: string; error: unknown; stage?: string }): void | Promise<void>;
  onEnd?(event: { runId: string; result: OrchestrationResult }): void | Promise<void>;
}

/** No-op implementation that does nothing. */
export const noopObservability: Observability = {};

/** Simple console-based implementation for local debugging. */
export const consoleObservability: Observability = {
  onStart: ({ runId, pattern, agents, input }) => {
    // eslint-disable-next-line no-console
    console.log(
      `[ai-observe] start runId=${runId} pattern=${pattern} agents=${agents.join(',')} input=${input.length}`
    );
  },
  onMessage: ({ runId, from, message, stage }) => {
    // eslint-disable-next-line no-console
    console.log(
      `[ai-observe] message runId=${runId} from=${from} stage=${stage ?? 'n/a'} role=${message.role} len=${message.content.length}`
    );
  },
  onError: ({ runId, error, stage }) => {
    // eslint-disable-next-line no-console
    console.error(`[ai-observe] error runId=${runId} stage=${stage ?? 'n/a'}`, error);
  },
  onEnd: ({ runId, result }) => {
    // eslint-disable-next-line no-console
    console.log(
      `[ai-observe] end runId=${runId} completed=${result.completed} transcript=${result.transcript.length}`
    );
  },
};
