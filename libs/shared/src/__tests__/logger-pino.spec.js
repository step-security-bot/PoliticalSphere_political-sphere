import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    correlationIdMiddleware,
    createLogger,
    generateCorrelationId,
    getLogger,
    LOG_LEVELS,
    setCorrelationId,
} from '../logger-pino.js';

describe('Pino Logger', () => {
  beforeEach(() => {
    // Reset singleton between tests
    vi.resetModules();
  });

  describe('createLogger', () => {
    it('should create logger instances', () => {
      const logger1 = createLogger({ service: 'test-1' });
      const logger2 = createLogger({ service: 'test-2' });

      expect(logger1).toBeDefined();
      expect(logger2).toBeDefined();
      expect(logger1).not.toBe(logger2);
    });

    it('should have all log level methods', () => {
      const logger = createLogger({ service: 'test' });

      expect(logger.debug).toBeInstanceOf(Function);
      expect(logger.info).toBeInstanceOf(Function);
      expect(logger.warn).toBeInstanceOf(Function);
      expect(logger.error).toBeInstanceOf(Function);
      expect(logger.fatal).toBeInstanceOf(Function);
    });
  });

  describe('getLogger', () => {
    it('should return singleton instance', () => {
      const logger1 = getLogger({ service: 'test' });
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });
  });

  describe('log levels', () => {
    it('should export LOG_LEVELS constant', () => {
      expect(LOG_LEVELS).toBeDefined();
      expect(LOG_LEVELS.DEBUG).toBe('debug');
      expect(LOG_LEVELS.INFO).toBe('info');
      expect(LOG_LEVELS.WARN).toBe('warn');
      expect(LOG_LEVELS.ERROR).toBe('error');
      expect(LOG_LEVELS.FATAL).toBe('fatal');
    });
  });

  describe('logRequest', () => {
    it('should log HTTP requests with appropriate level', () => {
      const logger = createLogger({ service: 'test' });
      const spy = vi.spyOn(logger.pino, 'info');

      const req = {
        method: 'GET',
        url: '/api/test',
        headers: { 'user-agent': 'test-agent' },
      };
      const res = { statusCode: 200 };

      logger.logRequest(req, res, 150);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          req: expect.objectContaining({ method: 'GET' }),
          res: expect.objectContaining({ statusCode: 200 }),
          duration: 150,
        }),
        'HTTP request'
      );
    });

    it('should log 4xx errors with warn level', () => {
      const logger = createLogger({ service: 'test' });
      const spy = vi.spyOn(logger.pino, 'warn');

      const req = {
        method: 'GET',
        url: '/api/test',
        headers: {},
      };
      const res = { statusCode: 404 };

      logger.logRequest(req, res, 50);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          res: expect.objectContaining({ statusCode: 404 }),
        }),
        'HTTP client error'
      );
    });

    it('should log 5xx errors with error level', () => {
      const logger = createLogger({ service: 'test' });
      const spy = vi.spyOn(logger.pino, 'error');

      const req = {
        method: 'POST',
        url: '/api/test',
        headers: {},
      };
      const res = { statusCode: 500 };

      logger.logRequest(req, res, 1000);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          res: expect.objectContaining({ statusCode: 500 }),
        }),
        'HTTP request failed'
      );
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security events with details', () => {
      const logger = createLogger({ service: 'test' });
      const spy = vi.spyOn(logger.pino, 'warn');

      logger.logSecurityEvent({
        event: 'SUSPICIOUS_ACTIVITY',
        reason: 'too many requests',
        ip: '192.168.1.1',
        userAgent: 'malicious-bot',
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          securityEvent: 'SUSPICIOUS_ACTIVITY',
          reason: 'too many requests',
          ip: '192.168.1.1',
          userAgent: 'malicious-bot',
        }),
        'SECURITY_EVENT'
      );
    });
  });

  describe('logError', () => {
    it('should log errors with stack trace', () => {
      const logger = createLogger({ service: 'test' });
      const spy = vi.spyOn(logger.pino, 'error');

      const error = new Error('Test error');
      const context = { userId: '123', operation: 'test' };

      logger.logError(error, context);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          err: error,
          userId: '123',
          operation: 'test',
        }),
        'Application error'
      );
    });
  });

  describe('child logger', () => {
    it('should create child logger with bindings', () => {
      const logger = createLogger({ service: 'test' });
      const child = logger.child({ requestId: 'req-123' });

      expect(child).toBeDefined();
      expect(child.pino).toBeDefined();
    });
  });

  describe('correlation ID', () => {
    it('should generate correlation IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });

    it('should set correlation ID in async context', async () => {
      const logger = createLogger({ service: 'test' });
      const spy = vi.spyOn(logger.pino, 'info');

      await new Promise(resolve => {
        setCorrelationId('test-correlation-123', () => {
          logger.info('Test message', { data: 'value' });

          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              correlationId: 'test-correlation-123',
              data: 'value',
            }),
            'Test message'
          );

          resolve();
        });
      });
    });
  });

  describe('correlationIdMiddleware', () => {
    it('should add correlation ID to request context', async () => {
      const req = { headers: {} };
      const res = {
        setHeader: vi.fn(),
      };

      await new Promise(resolve => {
        const next = () => {
          expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', expect.any(String));
          resolve();
        };

        correlationIdMiddleware(req, res, next);
      });
    });

    it('should use existing correlation ID from headers', async () => {
      const req = {
        headers: {
          'x-correlation-id': 'existing-123',
        },
      };
      const res = {
        setHeader: vi.fn(),
      };

      await new Promise(resolve => {
        const next = () => {
          expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'existing-123');
          resolve();
        };

        correlationIdMiddleware(req, res, next);
      });
    });

    it('should use x-request-id as fallback', async () => {
      const req = {
        headers: {
          'x-request-id': 'request-456',
        },
      };
      const res = {
        setHeader: vi.fn(),
      };

      await new Promise(resolve => {
        const next = () => {
          expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'request-456');
          resolve();
        };

        correlationIdMiddleware(req, res, next);
      });
    });
  });

  describe('close and flush', () => {
    it('should have close method', () => {
      const logger = createLogger({ service: 'test' });
      expect(logger.close).toBeInstanceOf(Function);
      logger.close(); // Should not throw
    });

    it('should have flush method', async () => {
      const logger = createLogger({ service: 'test' });
      expect(logger.flush).toBeInstanceOf(Function);
      await logger.flush(); // Should not throw
    });
  });
});
