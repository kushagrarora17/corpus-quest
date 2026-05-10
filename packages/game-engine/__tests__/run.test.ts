import { describe, expect, it } from 'vitest';

import { createNewRun } from '../src/run.js';

const PAISE_PER_RUPEE = 100;
const MIN = 25_000 * PAISE_PER_RUPEE;
const MAX = 45_000 * PAISE_PER_RUPEE;

describe('createNewRun', () => {
  it('starting salary is in ₹25,000–₹45,000/month range', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const s = createNewRun(seed);
      expect(s.salary).toBeGreaterThanOrEqual(MIN);
      expect(s.salary).toBeLessThanOrEqual(MAX);
    }
  });

  it('different seeds produce different starting salaries', () => {
    const sample = ['s1', 's2', 's3', 's4', 's5'].map((s) => createNewRun(s).salary);
    const unique = new Set(sample);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('initial portfolio value is 0', () => {
    const s = createNewRun('init');
    expect(s.investments).toHaveLength(0);
    expect(s.portfolio).toHaveLength(0);
    expect(s.cash).toBe(0);
  });

  it('starts at month 0 with the SELF dependent at 7000 happiness', () => {
    const s = createNewRun('init-2');
    expect(s.month).toBe(0);
    expect(s.dependents).toHaveLength(1);
    expect(s.dependents[0]?.type).toBe('SELF');
    expect(s.dependents[0]?.happiness).toBe(7000);
  });
});
