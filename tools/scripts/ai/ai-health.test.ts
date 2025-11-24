import { describe, expect, it } from 'vitest';

import { runHealthCheck } from './ai-health.mjs';

describe('ai-health', () => {
  it('returns failures when required directories are missing', async () => {
    const result = await runHealthCheck({
      cacheDir: './nonexistent-cache-dir',
      indexDir: './nonexistent-index-dir',
      fastMode: true,
      quiet: true,
    });
    expect(result.ok).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
  });
});
