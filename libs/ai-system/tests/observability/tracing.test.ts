/**
 * Tracing Tests
 *
 * Tests for distributed tracing with OpenTelemetry.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { AITracer } from '../../src/observability/tracing';

describe('AITracer', () => {
  let tracer: AITracer;

  beforeEach(() => {
    tracer = new AITracer('test-service');
  });

  it('should create span', () => {
    const span = tracer.startSpan('test-operation', {
      attributes: { userId: 'user-123' },
    });

    expect(span).toBeDefined();
    expect(span.name).toBe('test-operation');
  });

  it('should add events to span', () => {
    const span = tracer.startSpan('test-operation');
    span.addEvent('validation-started', { timestamp: new Date() });

    expect(span.events.length).toBeGreaterThan(0);
  });

  it('should end span and record duration', () => {
    const span = tracer.startSpan('test-operation');
    span.end();

    expect(span.ended).toBe(true);
    expect(span.duration).toBeGreaterThan(0);
  });

  it('should propagate trace context', () => {
    const parentSpan = tracer.startSpan('parent-operation');
    const childSpan = tracer.startSpan('child-operation', {
      parent: parentSpan,
    });

    expect(childSpan.traceId).toBe(parentSpan.traceId);
    expect(childSpan.parentId).toBe(parentSpan.spanId);
  });
});
