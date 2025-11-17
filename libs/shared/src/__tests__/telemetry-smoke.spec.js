/**
 * Smoke test for OpenTelemetry integration
 * Verifies that telemetry can be initialized without errors
 */
import { describe, expect, it } from 'vitest';

describe('OpenTelemetry Smoke Test', () => {
  it('should export startTelemetry function', async () => {
    const { startTelemetry } = await import('../telemetry.ts');
    expect(startTelemetry).toBeDefined();
    expect(typeof startTelemetry).toBe('function');
  });

  it('should export initTelemetry function', async () => {
    const { initTelemetry } = await import('../telemetry.ts');
    expect(initTelemetry).toBeDefined();
    expect(typeof initTelemetry).toBe('function');
  });

  it('should initialize telemetry SDK with minimal config', async () => {
    const { initTelemetry } = await import('../telemetry.ts');
    
    // Initialize but don't start (to avoid side effects in tests)
    const sdk = initTelemetry({
      serviceName: 'test-service',
      environment: 'test',
    });

    expect(sdk).toBeDefined();
    expect(sdk.start).toBeDefined();
    expect(typeof sdk.start).toBe('function');
    
    // Shutdown to clean up
    await sdk.shutdown();
  });
});
