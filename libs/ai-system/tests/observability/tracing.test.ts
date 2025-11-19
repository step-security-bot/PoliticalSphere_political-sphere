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

  it('should add events via tracer', () => {
    const span = tracer.startSpan('test-operation');
    tracer.addEvent(span.spanId, 'custom-event', { key: 'value' });

    expect(span.events.length).toBe(1);
    expect(span.events[0].name).toBe('custom-event');
    expect(span.events[0].attributes).toEqual({ key: 'value' });
  });

  it('should end span via legacy method', () => {
    const span = tracer.startSpan('test-operation');
    const spanId = span.spanId;

    tracer.endSpan(spanId, { code: 'ok' });

    // Legacy method doesn't update SpanWrapper, check if span is completed
    const completedSpan = tracer.getSpan(spanId);
    expect(completedSpan).toBeDefined();
    expect(completedSpan?.status.code).toBe('ok');
  });

  it('should get span by ID', () => {
    const span = tracer.startSpan('test-operation');
    const spanId = span.spanId;

    const retrieved = tracer.getSpan(spanId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.spanId).toBe(spanId);
  });

  it('should get completed span by ID', () => {
    const span = tracer.startSpan('test-operation');
    const spanId = span.spanId;
    span.end();

    const retrieved = tracer.getSpan(spanId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.spanId).toBe(spanId);
  });

  it('should get all spans for a trace', () => {
    const span1 = tracer.startSpan('operation-1');
    const span2 = tracer.startSpan('operation-2', { parent: span1 });
    const traceId = span1.traceId;

    span1.end();
    span2.end();

    const trace = tracer.getTrace(traceId);
    expect(trace.length).toBe(2);
    expect(trace.every(s => s.traceId === traceId)).toBe(true);
  });

  it('should handle ending span multiple times', () => {
    const span = tracer.startSpan('test-operation');
    span.end();
    span.end(); // Should not error

    expect(span.ended).toBe(true);
  });

  it('should end span with error status', () => {
    const span = tracer.startSpan('test-operation');
    span.end({ code: 'error', message: 'Test error' });

    expect(span.ended).toBe(true);
  });
});
