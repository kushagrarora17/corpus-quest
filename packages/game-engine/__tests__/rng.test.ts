import { describe, expect, it } from 'vitest';

import { makeRng, rngInt, rngShuffle } from '../src/rng.js';

describe('rng', () => {
  it('returns the same float for identical (seed, month, salt)', () => {
    const a = makeRng('seed-1', 5, 'nav');
    const b = makeRng('seed-1', 5, 'nav');
    expect(a).toBe(b);
  });

  it('different salt yields different float', () => {
    const a = makeRng('seed-1', 5, 'nav');
    const b = makeRng('seed-1', 5, 'event');
    expect(a).not.toBe(b);
  });

  it('rngInt is bounded inclusively', () => {
    for (let m = 0; m < 100; m += 1) {
      const v = rngInt('seed-x', m, 'salt', 1, 5);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(5);
    }
  });

  it('rngShuffle is deterministic and preserves elements', () => {
    const a = rngShuffle([1, 2, 3, 4, 5], 'seed-1', 'salt');
    const b = rngShuffle([1, 2, 3, 4, 5], 'seed-1', 'salt');
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
