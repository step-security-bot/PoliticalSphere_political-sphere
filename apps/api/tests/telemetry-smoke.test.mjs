/**
 * Smoke test for OpenTelemetry integration
 * Verifies that telemetry can be initialized without errors
 */
import { describe, expect, it } from 'vitest';

describe('OpenTelemetry Smoke Test', () => {
  it('should export startTelemetry function', async () => {
    const { startTelemetry } = await import('@political-sphere/shared');
    expect(startTelemetry).toBeDefined();
    expect(typeof startTelemetry).toBe('function');
  });

  it('should export initTelemetry function', async () => {
    const { initTelemetry } = await import('@political-sphere/shared');
    expect(initTelemetry).toBeDefined();
    expect(typeof initTelemetry).toBe('function');
  });

  it('should initialize telemetry with minimal config', async () => {
    const { initTelemetry } = await import('@political-sphere/shared');
    
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

  it('should handle telemetry initialization errors gracefully', async () => {
    const { startTelemetry } = await import('@political-sphere/shared');
    
    // Test with invalid configuration should not throw
    await expect(
      startTelemetry({
        serviceName: '', // Invalid: empty service name
        environment: 'test',
      })
    ).rejects.toThrow();
  });
});
