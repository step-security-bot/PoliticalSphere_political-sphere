import { describe, expect, it } from 'vitest';

import { checkNeutrality } from './ci-neutrality-check.mjs';

describe('ci-neutrality-check', () => {
  it('passes clearly neutral content', async () => {
    const result = await checkNeutrality('This is a neutral system overview.');
    expect(result.passed).toBe(true);
    expect(result.biases).toHaveLength(0);
    expect(result.score).toBe(1);
  });

  it('flags partisan phrases and lowers score', async () => {
    const result = await checkNeutrality('The conservative agenda is obviously superior.');
    expect(result.passed).toBe(false);
    expect(result.biases.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it('ignores neutral exception contexts (fixtures/examples)', async () => {
    const result = await checkNeutrality('This is a political simulation fixture for tests.');
    expect(result.passed).toBe(true);
  });
});
