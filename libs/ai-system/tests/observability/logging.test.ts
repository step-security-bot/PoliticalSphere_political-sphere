/**
 * Structured Logging Tests
 *
 * Tests for structured JSON logging with correlation IDs.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StructuredLogger } from '../../src/observability/logging';

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new StructuredLogger('test-service');

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should log debug messages', () => {
    logger.debug('Debug message', { userId: '123' });

    expect(consoleLogSpy).toHaveBeenCalled();
    const logCall = consoleLogSpy.mock.calls[0][0];
    const parsed = JSON.parse(logCall);

    expect(parsed.level).toBe('debug');
    expect(parsed.message).toBe('Debug message');
    expect(parsed.context.service).toBe('test-service');
    expect(parsed.context.userId).toBe('123');
  });

  it('should log info messages', () => {
    logger.info('Info message');

    expect(consoleInfoSpy).toHaveBeenCalled();
    const logCall = consoleInfoSpy.mock.calls[0][0];
    const parsed = JSON.parse(logCall);

    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('Info message');
  });

  it('should log warnings with context', () => {
    logger.warn('Warning message', { component: 'auth' });

    expect(consoleWarnSpy).toHaveBeenCalled();
    const logCall = consoleWarnSpy.mock.calls[0][0];
    const parsed = JSON.parse(logCall);

    expect(parsed.level).toBe('warn');
    expect(parsed.context.component).toBe('auth');
  });

  it('should log errors with error details', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', { error });

    expect(consoleErrorSpy).toHaveBeenCalled();
    const logCall = consoleErrorSpy.mock.calls[0][0];
    const parsed = JSON.parse(logCall);

    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('Error occurred');
  });

  it('should log fatal errors with context', () => {
    logger.fatal('Fatal error', undefined, { code: 'SYSTEM_FAILURE' });

    expect(consoleErrorSpy).toHaveBeenCalled();
    const logCall = consoleErrorSpy.mock.calls[0][0];
    const parsed = JSON.parse(logCall);

    expect(parsed.level).toBe('fatal');
    expect(parsed.context).toBeDefined();
    expect(parsed.context.code).toBe('SYSTEM_FAILURE');
  });

  it('should include trace and span IDs', () => {
    logger.info('Traced operation', {
      traceId: 'trace-123',
      spanId: 'span-456',
    });

    expect(consoleInfoSpy).toHaveBeenCalled();
    const logCall = consoleInfoSpy.mock.calls[0][0];
    const parsed = JSON.parse(logCall);

    expect(parsed.traceId).toBe('trace-123');
    expect(parsed.spanId).toBe('span-456');
  });

  it('should include timestamp in ISO format', () => {
    logger.info('Timestamped message');

    const logCall = consoleInfoSpy.mock.calls[0][0];
    const parsed = JSON.parse(logCall);

    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should handle messages without context', () => {
    logger.info('Simple message');

    expect(consoleInfoSpy).toHaveBeenCalled();
    const logCall = consoleInfoSpy.mock.calls[0][0];
    const parsed = JSON.parse(logCall);

    expect(parsed.message).toBe('Simple message');
    expect(parsed.context.service).toBe('test-service');
  });
});
