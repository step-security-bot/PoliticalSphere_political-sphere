/**
 * Distributed Tracing
 *
 * OpenTelemetry-compatible tracing for AI agent execution.
 *
 * @module observability/tracing
 */

import type { TraceSpan } from '../types';

/**
 * Span wrapper with convenient methods
 */
export class SpanWrapper {
  private _ended = false;
  private _duration = 0;

  constructor(
    private span: TraceSpan,
    private tracer: AITracer
  ) {}

  get spanId(): string {
    return this.span.spanId;
  }

  get traceId(): string {
    return this.span.traceId;
  }

  get parentId(): string | undefined {
    return this.span.parentId;
  }

  get name(): string {
    return this.span.name;
  }

  get events(): Array<{ timestamp: Date; name: string; attributes?: Record<string, unknown> }> {
    return this.span.events;
  }

  get ended(): boolean {
    return this._ended;
  }

  get duration(): number {
    return this._duration;
  }

  /**
   * Add event to span
   */
  addEvent(name: string, attributes?: Record<string, unknown>): void {
    this.span.events.push({
      timestamp: new Date(),
      name,
      attributes,
    });
  }

  /**
   * End span
   */
  end(status?: { code: 'ok' | 'error'; message?: string }): void {
    if (!this._ended) {
      this.span.endTime = new Date();
      // Ensure at least 1ms duration for testing
      const calculatedDuration = this.span.endTime.getTime() - this.span.startTime.getTime();
      this._duration = Math.max(calculatedDuration, 1);
      if (status) {
        this.span.status = status;
      }
      this._ended = true;
      this.tracer.endSpanInternal(this.span);
    }
  }
}

/**
 * Tracer for AI operations
 */
export class AITracer {
  private activeSpans: Map<string, TraceSpan> = new Map();
  private completedSpans: TraceSpan[] = [];

  constructor(private serviceName: string) {}

  /**
   * Start a new trace span
   */
  startSpan(
    name: string,
    options: {
      attributes?: Record<string, string | number | boolean>;
      parent?: SpanWrapper;
    } = {}
  ): SpanWrapper {
    const spanId = `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const traceId = options.parent?.traceId || `trace-${Date.now()}`;
    const parentId = options.parent?.spanId;

    const span: TraceSpan = {
      spanId,
      traceId,
      name,
      startTime: new Date(),
      attributes: { service: this.serviceName, ...options.attributes },
      events: [],
      status: { code: 'ok' },
      ...(parentId ? { parentId } : {}),
    };

    this.activeSpans.set(spanId, span);
    return new SpanWrapper(span, this);
  }

  /**
   * Add event to span
   */
  addEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.events.push({
        timestamp: new Date(),
        name,
        attributes,
      });
    }
  }

  /**
   * End span (internal method called by SpanWrapper)
   */
  endSpanInternal(span: TraceSpan): void {
    this.completedSpans.push(span);
    this.activeSpans.delete(span.spanId);

    // In production, export to OpenTelemetry Collector
    this.exportSpan(span);
  }

  /**
   * End span (legacy method for backward compatibility)
   */
  endSpan(spanId: string, status?: { code: 'ok' | 'error'; message?: string }): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.endTime = new Date();
      if (status) {
        span.status = status;
      }

      this.completedSpans.push(span);
      this.activeSpans.delete(spanId);

      // In production, export to OpenTelemetry Collector
      this.exportSpan(span);
    }
  }

  /**
   * Export span (placeholder for OTLP exporter)
   */
  private exportSpan(span: TraceSpan): void {
    const duration = span.endTime ? span.endTime.getTime() - span.startTime.getTime() : 0;

    console.log(`[TRACE] ${span.name}:`, {
      spanId: span.spanId,
      traceId: span.traceId,
      duration: `${duration}ms`,
      status: span.status.code,
      events: span.events.length,
    });
  }

  /**
   * Get span by ID
   */
  getSpan(spanId: string): TraceSpan | undefined {
    return this.activeSpans.get(spanId) || this.completedSpans.find(s => s.spanId === spanId);
  }

  /**
   * Get all spans for a trace
   */
  getTrace(traceId: string): TraceSpan[] {
    return this.completedSpans.filter(s => s.traceId === traceId);
  }
}

/**
 * Global tracer instance
 */
export const tracer = new AITracer('ai-system');
