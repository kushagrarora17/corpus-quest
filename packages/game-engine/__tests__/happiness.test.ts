import { describe, expect, it } from 'vitest';

import {
  applyDecay,
  applySpend,
  averageHappiness,
  happinessLegacy,
  requiresHappinessAction,
} from '../src/happiness.js';
import type { Dependent } from '../src/types.js';

function self(happiness: number): Dependent {
  return { id: 'self', type: 'SELF', name: 'You', happiness, joinedMonth: 0 };
}

describe('happiness', () => {
  it('SELF decays 100/month — starts 7000, hits 2000 at month 50', () => {
    let deps = [self(7000)];
    for (let m = 0; m < 50; m += 1) {
      deps = applyDecay(deps);
    }
    expect((deps[0] as Dependent).happiness).toBe(2000);
  });

  it('floor is 0', () => {
    let deps = [self(50)];
    deps = applyDecay(deps);
    expect((deps[0] as Dependent).happiness).toBe(0);
  });

  it('₹10,000 spend on SELF below 8000 raises happiness ~5000', () => {
    const before = self(2000);
    const after = applySpend(before, 10_000 * 100);
    // Linear at 0.5 per rupee → 5000
    expect(after.happiness).toBe(7000);
  });

  it('above 8000 yields diminishing returns (< 50% normal)', () => {
    const baseline = applySpend(self(4000), 1_000 * 100); // +500 → 4500
    expect(baseline.happiness - 4000).toBe(500);

    const above = applySpend(self(9000), 1_000 * 100); // entirely diminishing zone
    expect(above.happiness - 9000).toBeLessThan(500 * 0.5);
  });

  it('requiresHappinessAction triggers on dependent < 2000', () => {
    expect(requiresHappinessAction([self(1500)])).toBe(true);
    expect(requiresHappinessAction([self(2000)])).toBe(false);
  });

  it('averageHappiness averages across dependents', () => {
    expect(averageHappiness([self(6000), self(4000)])).toBe(5000);
  });

  it('happinessLegacy averages over months', () => {
    const log = [
      { month: 0, average: 7000 },
      { month: 1, average: 5000 },
      { month: 2, average: 3000 },
    ];
    expect(happinessLegacy(log)).toBe(5000);
  });
});
