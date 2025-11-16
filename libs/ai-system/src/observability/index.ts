import { Message, OrchestrationResult } from '../types';

export interface Tracer {
  startSpan(name: string, attributes?: Record<string, unknown>): Span;
}

export interface Span {
  setAttribute(key: string, value: unknown): void;
  end(): void;
}

class NoopSpan implements Span {
  setAttribute(): void {}
  end(): void {}
}

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
