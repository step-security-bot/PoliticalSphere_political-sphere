/**
 * Health Check System
 *
 * Comprehensive health checks for application components including
 * database connectivity, external services, and system resources.
 */

import type { HealthCheckResult, HealthStatus } from './types.js';
import * as os from 'node:os';

export interface HealthChecker {
  name: string;
  check: () => Promise<HealthCheckResult>;
  timeout?: number;
  critical?: boolean;
}

class HealthCheckService {
  private checkers: Map<string, HealthChecker> = new Map();

  /**
   * Register a health check
   */
  register(checker: HealthChecker): void {
    this.checkers.set(checker.name, checker);
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): void {
    this.checkers.delete(name);
  }

  /**
   * Run all health checks
   */
  async runAllChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    const promises = Array.from(this.checkers.values()).map(async checker => {
      const startTime = Date.now();
      try {
        const timeout = checker.timeout || 5000; // 5 second default timeout
        const result = await Promise.race([
          checker.check(),
          new Promise<HealthCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), timeout)
          ),
        ]);
        result.duration = Date.now() - startTime;
        return result;
      } catch (error) {
        return {
          name: checker.name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        };
      }
    });

    const resolvedResults = await Promise.all(promises);
    // Ensure all items conform to HealthCheckResult (defensive typing)
    for (const r of resolvedResults) {
      results.push(r as HealthCheckResult);
    }

    return results;
  }

  /**
   * Get overall health status
   */
  async getOverallHealth(): Promise<{ status: HealthStatus; checks: HealthCheckResult[] }> {
    const results = await this.runAllChecks();
    const criticalFailures = results.filter(
      result => result.status === 'unhealthy' && this.checkers.get(result.name)?.critical
    );

    let overallStatus: HealthStatus = 'healthy';
    if (criticalFailures.length > 0) {
      overallStatus = 'unhealthy';
    } else if (results.some(r => r.status === 'degraded')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      checks: results,
    };
  }

  /**
   * Run a specific health check
   */
  async runCheck(name: string): Promise<HealthCheckResult | null> {
    const checker = this.checkers.get(name);
    if (!checker) return null;

    const startTime = Date.now();
    try {
      const result = await checker.check();
      result.duration = Date.now() - startTime;
      return result;
    } catch (error) {
      return {
        name: checker.name,
        status: 'unhealthy' as HealthStatus,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }
}

// Singleton instance
let healthServiceInstance: HealthCheckService | null = null;

/**
 * Get health check service instance
 */
export function getHealthCheckService(): HealthCheckService {
  if (!healthServiceInstance) {
    healthServiceInstance = new HealthCheckService();
  }
  return healthServiceInstance;
}

/**
 * Create database health check
 */
export function createDatabaseHealthCheck(
  name: string,
  checkFunction: () => Promise<void>,
  options: { timeout?: number; critical?: boolean } = {}
): HealthChecker {
  return {
    name,
    ...(options.timeout && { timeout: options.timeout }),
    critical: options.critical ?? true,
    check: async (): Promise<HealthCheckResult> => {
      try {
        await checkFunction();
        return {
          name,
          status: 'healthy',
          message: 'Database connection successful',
          timestamp: new Date().toISOString(),
          duration: 0,
        };
      } catch (error) {
        return {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Database connection failed',
          timestamp: new Date().toISOString(),
          duration: 0,
        };
      }
    },
  };
}

/**
 * Create external service health check
 */
export function createExternalServiceHealthCheck(
  name: string,
  url: string,
  options: { timeout?: number; critical?: boolean; expectedStatus?: number } = {}
): HealthChecker {
  return {
    name,
    timeout: options.timeout || 3000,
    critical: options.critical ?? false,
    check: async (): Promise<HealthCheckResult> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 3000);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const expectedStatus = options.expectedStatus || 200;
        if (response.status === expectedStatus) {
          return {
            name,
            status: 'healthy',
            message: `Service responded with ${response.status}`,
            timestamp: new Date().toISOString(),
            duration: 0,
          };
        } else {
          return {
            name,
            status: 'degraded',
            message: `Service responded with ${response.status}, expected ${expectedStatus}`,
            timestamp: new Date().toISOString(),
            duration: 0,
          };
        }
      } catch (error) {
        return {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Service unreachable',
          timestamp: new Date().toISOString(),
          duration: 0,
        };
      }
    },
  };
}

/**
 * Create system resource health check
 */
export function createSystemResourceHealthCheck(
  name: string,
  options: {
    memoryThreshold?: number;
    cpuThreshold?: number;
    diskThreshold?: number;
    timeout?: number;
    critical?: boolean;
  } = {}
): HealthChecker {
  return {
    name,
    timeout: options.timeout || 1000,
    critical: options.critical ?? true,
    check: async (): Promise<HealthCheckResult> => {
      try {
        const memUsage = process.memoryUsage();
        const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

        const memoryThreshold = options.memoryThreshold || 90;
        const cpuThreshold = options.cpuThreshold || 95;

        // CPU usage check
        const cpus = os.cpus();
        let startIdle = 0,
          startTotal = 0;
        cpus.forEach(cpu => {
          startTotal +=
            cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
          startIdle += cpu.times.idle;
        });
        // Wait 100ms
        await new Promise(resolve => setTimeout(resolve, 100));
        const cpus2 = os.cpus();
        let endIdle = 0,
          endTotal = 0;
        cpus2.forEach(cpu => {
          endTotal +=
            cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
          endIdle += cpu.times.idle;
        });
        const idleDiff = endIdle - startIdle;
        const totalDiff = endTotal - startTotal;
        const cpuUsagePercent = Math.round(100 - (100 * idleDiff) / totalDiff);

        let status: HealthStatus = 'healthy';
        let message = 'System resources within acceptable limits';
        const messages: string[] = [];
        if (memUsagePercent > memoryThreshold) {
          messages.push(
            `Memory usage at ${memUsagePercent.toFixed(1)}% (threshold: ${memoryThreshold}%)`
          );
        }
        if (cpuUsagePercent > cpuThreshold) {
          messages.push(`CPU usage at ${cpuUsagePercent}% (threshold: ${cpuThreshold}%)`);
        }
        if (messages.length > 0) {
          status = 'degraded';
          message = messages.join(', ');
        }

        return {
          name,
          status,
          message,
          timestamp: new Date().toISOString(),
          duration: 0,
          details: {
            memoryUsagePercent: memUsagePercent.toFixed(1),
            cpuUsagePercent: cpuUsagePercent.toString(),
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
          },
        };
      } catch (error) {
        return {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Failed to check system resources',
          timestamp: new Date().toISOString(),
          duration: 0,
        };
      }
    },
  };
}

export { HealthCheckService };
export default getHealthCheckService;
