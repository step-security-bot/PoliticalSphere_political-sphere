# Graceful Shutdown Integration Examples

**Version:** 1.0.0  
**Last Updated:** 2025-11-17  
**Purpose:** Practical examples of integrating graceful shutdown utilities

---

## Table of Contents

1. [Basic HTTP Server](#basic-http-server)
2. [Express Server with Database](#express-server-with-database)
3. [Server with Connection Tracking](#server-with-connection-tracking)
4. [Testing Graceful Shutdown](#testing-graceful-shutdown)
5. [Production Best Practices](#production-best-practices)

---

## Basic HTTP Server

Minimal integration for a native Node.js HTTP server:

```typescript
import http from 'node:http';
import { setupGracefulShutdown } from '@political-sphere/shared';
import { logger } from './logger.js';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
});

// Setup graceful shutdown with 10-second timeout
const cleanup = setupGracefulShutdown(server, {
  timeout: 10000,
  logger,
});

server.listen(3000, () => {
  logger.info('Server listening', { port: 3000 });
});

// Optional: Manual cleanup on specific conditions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  cleanup(); // Trigger shutdown manually
});
```

**What happens on SIGTERM/SIGINT:**

1. Signal handler triggers shutdown
2. Server stops accepting new connections (`server.close()`)
3. Waits up to 10 seconds for existing requests to complete
4. If timeout expires, forces shutdown
5. Process exits with code 0

---

## Express Server with Database

Integration with Express and cleanup callbacks for database/cache:

```typescript
import express from 'express';
import { setupGracefulShutdown } from '@political-sphere/shared';
import { logger } from './logger.js';
import { db } from './database.js';
import { cache } from './cache.js';

const app = express();

// Your Express routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const server = app.listen(3000, () => {
  logger.info('Server listening', { port: 3000 });
});

// Setup graceful shutdown with cleanup callback
setupGracefulShutdown(server, {
  timeout: 15000, // 15 seconds
  logger,
  onShutdown: async () => {
    logger.info('Running cleanup tasks...');
    
    // Close database connections
    await db.close();
    logger.info('Database connections closed');
    
    // Close cache connections
    await cache.disconnect();
    logger.info('Cache disconnected');
    
    // Close any other resources (message queues, file handles, etc.)
  },
});
```

**Cleanup order:**

1. SIGTERM/SIGINT received
2. Stop accepting new requests
3. Wait for active requests to complete (up to 15s)
4. Execute `onShutdown` callback:
   - Close database connections
   - Disconnect from cache
   - Clean up other resources
5. Process exits gracefully

---

## Server with Connection Tracking

Advanced integration tracking active connections:

```typescript
import http from 'node:http';
import {
  setupGracefulShutdown,
  ConnectionTracker,
} from '@political-sphere/shared';
import { logger } from './logger.js';

// Create connection tracker
const connectionTracker = new ConnectionTracker();

const server = http.createServer(async (req, res) => {
  // Register connection at start of request
  const connectionId = `req-${Date.now()}-${Math.random()}`;
  connectionTracker.register(connectionId);
  
  try {
    // Simulate async work
    await processRequest(req, res);
  } finally {
    // Always unregister when done
    connectionTracker.unregister(connectionId);
  }
});

// Setup graceful shutdown
setupGracefulShutdown(server, {
  timeout: 20000, // 20 seconds
  logger,
  onShutdown: async () => {
    logger.info('Waiting for active connections...', {
      activeConnections: connectionTracker.getActiveConnections(),
    });
    
    // Wait for all connections to complete (with 15s timeout)
    const allCompleted = await connectionTracker.waitForCompletion(15000);
    
    if (allCompleted) {
      logger.info('All connections completed gracefully');
    } else {
      logger.warn('Some connections timed out', {
        remaining: connectionTracker.getActiveConnections(),
      });
    }
  },
});

server.listen(3000, () => {
  logger.info('Server listening with connection tracking', { port: 3000 });
});

async function processRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  // Your request processing logic
  await new Promise((resolve) => setTimeout(resolve, 100));
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Request processed\n');
}
```

**Benefits of connection tracking:**

- Know exactly how many requests are in-flight during shutdown
- Wait for specific operations to complete
- Log which connections are taking too long
- Better observability during deployments

---

## Testing Graceful Shutdown

How to test graceful shutdown in your test suite:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { setupGracefulShutdown } from '@political-sphere/shared';

describe('Server graceful shutdown', () => {
  let server: http.Server;
  let cleanup: () => void;

  beforeEach(() => {
    server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });
  });

  afterEach(async () => {
    if (cleanup) {
      cleanup();
    }
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('should execute cleanup callback on SIGTERM', async () => {
    const onShutdown = vi.fn().mockResolvedValue(undefined);
    
    cleanup = setupGracefulShutdown(server, {
      timeout: 5000,
      onShutdown,
    });

    // Simulate SIGTERM
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    process.emit('SIGTERM');
    
    // Wait for async shutdown
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onShutdown).toHaveBeenCalledTimes(1);
    mockExit.mockRestore();
  });

  it('should enforce timeout if cleanup takes too long', async () => {
    const slowCleanup = vi.fn().mockImplementation(async () => {
      // Simulate slow cleanup (longer than timeout)
      await new Promise((resolve) => setTimeout(resolve, 10000));
    });

    cleanup = setupGracefulShutdown(server, {
      timeout: 100, // Very short timeout for test
      onShutdown: slowCleanup,
    });

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    const start = Date.now();
    process.emit('SIGTERM');
    
    // Wait for timeout to expire
    await new Promise((resolve) => setTimeout(resolve, 200));

    const duration = Date.now() - start;
    
    // Should complete around timeout duration (100ms), not full cleanup (10000ms)
    expect(duration).toBeLessThan(500);
    expect(slowCleanup).toHaveBeenCalled();
    
    mockExit.mockRestore();
  });
});
```

---

## Production Best Practices

### 1. Timeout Configuration

Choose timeouts based on your application's needs:

```typescript
// Short-lived API (95th percentile < 200ms)
setupGracefulShutdown(server, {
  timeout: 10000, // 10 seconds is plenty
});

// Long-running operations (video encoding, batch processing)
setupGracefulShutdown(server, {
  timeout: 60000, // 60 seconds to complete
});

// Real-time services with strict SLA
setupGracefulShutdown(server, {
  timeout: 5000, // Force fast shutdown
});
```

### 2. Structured Logging

Use structured logging for better observability:

```typescript
import { createLogger } from '@political-sphere/shared';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  service: 'api-server',
});

setupGracefulShutdown(server, {
  timeout: 15000,
  logger, // Logs will include service context
  onShutdown: async () => {
    logger.info('Graceful shutdown initiated', {
      timestamp: new Date().toISOString(),
      activeConnections: getActiveConnectionCount(),
    });
    
    // Your cleanup logic
    
    logger.info('Cleanup completed successfully');
  },
});
```

### 3. Health Check Integration

Update health checks during shutdown:

```typescript
let isShuttingDown = false;

app.get('/health', (req, res) => {
  if (isShuttingDown) {
    // Return 503 during shutdown to signal load balancer
    res.status(503).json({
      status: 'shutting_down',
      message: 'Server is gracefully shutting down',
    });
  } else {
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
    });
  }
});

setupGracefulShutdown(server, {
  timeout: 15000,
  logger,
  onShutdown: async () => {
    // Immediately mark as shutting down
    isShuttingDown = true;
    logger.info('Health check now returns 503');
    
    // Give load balancer time to detect unhealthy state
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Continue with cleanup
    await db.close();
  },
});
```

**Why this matters:**

- Load balancers check `/health` regularly (every 5-10 seconds)
- Returning 503 signals "don't send new traffic here"
- Gives time for existing requests to complete
- Prevents connection errors during deployment

### 4. Kubernetes/Docker Integration

Configure proper termination in Kubernetes:

**Deployment YAML:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  template:
    spec:
      containers:
        - name: api
          image: api-server:latest
          lifecycle:
            preStop:
              exec:
                # Wait 5 seconds before sending SIGTERM
                # Gives load balancer time to detect unhealthy pod
                command: ['/bin/sh', '-c', 'sleep 5']
          # Grace period for shutdown (should exceed app timeout)
          terminationGracePeriodSeconds: 30
```

**Application configuration:**

```typescript
setupGracefulShutdown(server, {
  // Must be less than terminationGracePeriodSeconds
  // Leave buffer for preStop hook
  timeout: 20000, // 20 seconds (30s - 5s preStop - 5s buffer)
  logger,
});
```

### 5. Metrics and Monitoring

Track shutdown metrics for observability:

```typescript
import { Counter, Histogram } from 'prom-client';

const shutdownCounter = new Counter({
  name: 'graceful_shutdown_total',
  help: 'Total number of graceful shutdowns',
  labelNames: ['signal', 'success'],
});

const shutdownDuration = new Histogram({
  name: 'graceful_shutdown_duration_seconds',
  help: 'Time taken for graceful shutdown',
  buckets: [1, 5, 10, 15, 20, 30],
});

setupGracefulShutdown(server, {
  timeout: 15000,
  logger,
  onShutdown: async () => {
    const startTime = Date.now();
    let success = true;

    try {
      await db.close();
      await cache.disconnect();
    } catch (error) {
      success = false;
      logger.error('Shutdown cleanup failed', { error });
      throw error;
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      
      shutdownCounter.inc({ signal: 'SIGTERM', success: String(success) });
      shutdownDuration.observe(duration);
      
      logger.info('Shutdown metrics recorded', {
        duration,
        success,
      });
    }
  },
});
```

### 6. Error Handling During Shutdown

Handle cleanup errors gracefully:

```typescript
setupGracefulShutdown(server, {
  timeout: 15000,
  logger,
  onShutdown: async () => {
    const errors: Error[] = [];

    // Try to close database (don't throw on error)
    try {
      await db.close();
      logger.info('Database closed');
    } catch (error) {
      logger.error('Failed to close database', { error });
      errors.push(error as Error);
    }

    // Try to disconnect cache (don't throw on error)
    try {
      await cache.disconnect();
      logger.info('Cache disconnected');
    } catch (error) {
      logger.error('Failed to disconnect cache', { error });
      errors.push(error as Error);
    }

    // Log all errors but continue shutdown
    if (errors.length > 0) {
      logger.warn('Shutdown completed with errors', {
        errorCount: errors.length,
        errors: errors.map((e) => e.message),
      });
    }
  },
});
```

**Why not throw errors?**

- Shutdown should always complete, even if cleanup fails
- Partial cleanup is better than no cleanup
- Log errors for debugging, but don't block shutdown
- Process will exit anyway, so throwing doesn't help

---

## Summary

**Key Takeaways:**

1. ✅ Always setup graceful shutdown for production servers
2. ✅ Configure timeouts based on your application's needs
3. ✅ Use `onShutdown` callback for resource cleanup
4. ✅ Track connections for better observability
5. ✅ Integrate with health checks (return 503 during shutdown)
6. ✅ Configure Kubernetes/Docker grace periods properly
7. ✅ Handle cleanup errors gracefully (log but don't throw)
8. ✅ Monitor shutdown metrics for debugging

**Related Documentation:**

- Implementation: `libs/shared/src/graceful-shutdown.ts`
- Test examples: `libs/shared/src/graceful-shutdown.test.ts`
- Error handling: `docs/05-engineering-and-devops/GUIDE-AppError-Usage.md`
- 12-Factor App compliance: `docs/05-engineering-and-devops/RESEARCH-FINDINGS-2025-11-17.md`
