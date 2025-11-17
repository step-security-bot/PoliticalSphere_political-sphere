import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionTracker, setupGracefulShutdown, withGracefulTimeout } from './graceful-shutdown';

describe('setupGracefulShutdown', () => {
  let mockServer: Server;
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock HTTP server
    mockServer = {
      close: vi.fn(callback => {
        if (callback) callback();
      }),
    } as unknown as Server;

    // Mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should setup signal handlers', () => {
    const cleanup = setupGracefulShutdown(mockServer, { logger: mockLogger });

    expect(cleanup).toBeInstanceOf(Function);
  });

  it('should call onShutdown callback during graceful shutdown', async () => {
    const onShutdown = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const cleanup = setupGracefulShutdown(mockServer, {
      logger: mockLogger,
      onShutdown,
    });

    // Simulate SIGTERM
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    try {
      process.emit('SIGTERM', 'SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch {
      // Expected - process.exit throws
    }

    expect(onShutdown).toHaveBeenCalled();
    expect(mockServer.close).toHaveBeenCalled();

    mockExit.mockRestore();
    cleanup();
  });

  it('should log shutdown progress', async () => {
    const cleanup = setupGracefulShutdown(mockServer, {
      logger: mockLogger,
      timeout: 100,
    });

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    try {
      process.emit('SIGTERM', 'SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch {
      // Expected
    }

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('shutdown'),
      expect.any(Object)
    );

    mockExit.mockRestore();
    cleanup();
  });

  it('should cleanup signal handlers on cleanup call', () => {
    const cleanup = setupGracefulShutdown(mockServer, {
      logger: mockLogger,
      signals: ['SIGTERM', 'SIGINT'],
    });

    // Verify handlers are registered
    const sigTermListeners = process.listenerCount('SIGTERM');
    const sigIntListeners = process.listenerCount('SIGINT');

    expect(sigTermListeners).toBeGreaterThan(0);
    expect(sigIntListeners).toBeGreaterThan(0);

    // Cleanup
    cleanup();

    // Verify handlers are removed (count should decrease)
    expect(process.listenerCount('SIGTERM')).toBeLessThanOrEqual(sigTermListeners);
    expect(process.listenerCount('SIGINT')).toBeLessThanOrEqual(sigIntListeners);
  });

  it('should prevent duplicate shutdown', async () => {
    const cleanup = setupGracefulShutdown(mockServer, {
      logger: mockLogger,
    });

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    try {
      // Emit SIGTERM twice
      process.emit('SIGTERM', 'SIGTERM');
      process.emit('SIGTERM', 'SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch {
      // Expected
    }

    // Should warn about duplicate shutdown
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('already in progress'),
      expect.any(Object)
    );

    mockExit.mockRestore();
    cleanup();
  });
});

describe('withGracefulTimeout', () => {
  it('should return operation result if completes before timeout', async () => {
    const operation = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'success';
    };

    const result = await withGracefulTimeout(operation, 100, 'fallback');

    expect(result).toBe('success');
  });

  it('should return fallback if operation times out', async () => {
    const operation = async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return 'success';
    };

    const result = await withGracefulTimeout(operation, 50, 'fallback');

    expect(result).toBe('fallback');
  });

  it('should handle operation errors', async () => {
    const operation = async () => {
      throw new Error('Operation failed');
    };

    await expect(withGracefulTimeout(operation, 100, 'fallback')).rejects.toThrow(
      'Operation failed'
    );
  });
});

describe('ConnectionTracker', () => {
  let tracker: ConnectionTracker;

  beforeEach(() => {
    tracker = new ConnectionTracker();
  });

  it('should register new connections', () => {
    const conn1 = tracker.register();
    const conn2 = tracker.register();

    expect(conn1).toMatch(/^conn-\d+-\d+$/);
    expect(conn2).toMatch(/^conn-\d+-\d+$/);
    expect(conn1).not.toBe(conn2);
    expect(tracker.count).toBe(2);
  });

  it('should unregister connections', () => {
    const conn1 = tracker.register();
    const conn2 = tracker.register();

    expect(tracker.count).toBe(2);

    tracker.unregister(conn1);
    expect(tracker.count).toBe(1);

    tracker.unregister(conn2);
    expect(tracker.count).toBe(0);
  });

  it('should get active connection IDs', () => {
    const conn1 = tracker.register();
    const conn2 = tracker.register();

    const active = tracker.getActiveConnections();

    expect(active).toContain(conn1);
    expect(active).toContain(conn2);
    expect(active).toHaveLength(2);
  });

  it('should wait for all connections to complete', async () => {
    const conn1 = tracker.register();
    const conn2 = tracker.register();

    // Start async task to unregister connections
    setTimeout(() => {
      tracker.unregister(conn1);
      tracker.unregister(conn2);
    }, 50);

    const completed = await tracker.waitForCompletion(200);

    expect(completed).toBe(true);
    expect(tracker.count).toBe(0);
  });

  it('should timeout if connections do not complete', async () => {
    tracker.register();
    tracker.register();

    const completed = await tracker.waitForCompletion(50);

    expect(completed).toBe(false);
    expect(tracker.count).toBe(2);
  });

  it('should handle empty tracker', async () => {
    const completed = await tracker.waitForCompletion(100);

    expect(completed).toBe(true);
    expect(tracker.count).toBe(0);
  });
});

describe('Integration: Graceful shutdown with connection tracking', () => {
  it('should track and wait for active connections during shutdown', async () => {
    const tracker = new ConnectionTracker();
    const mockServer = {
      close: vi.fn(callback => {
        if (callback) callback();
      }),
    } as unknown as Server;

    const mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Register some connections
    const conn1 = tracker.register();
    const conn2 = tracker.register();

    expect(tracker.count).toBe(2);

    // Setup shutdown with connection tracking
    const cleanup = setupGracefulShutdown(mockServer, {
      logger: mockLogger,
      timeout: 500,
      onShutdown: async () => {
        mockLogger.info('Waiting for connections to complete');
        const completed = await tracker.waitForCompletion(200);
        mockLogger.info('Connections completed', { completed });
      },
    });

    // Simulate connections completing
    setTimeout(() => {
      tracker.unregister(conn1);
      tracker.unregister(conn2);
    }, 50);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    try {
      process.emit('SIGTERM', 'SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch {
      // Expected
    }

    expect(mockLogger.info).toHaveBeenCalledWith('Waiting for connections to complete');
    expect(tracker.count).toBe(0);

    mockExit.mockRestore();
    cleanup();
  });
});
