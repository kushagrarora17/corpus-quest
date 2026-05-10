import { describe, expect, it } from 'vitest';

import { createNewRun } from '../src/run.js';
import { resolveTurn } from '../src/turn.js';
import type { GameState } from '../src/types.js';

const PAISE_PER_RUPEE = 100;

/**
 * Plays a full run end-to-end. Strategy:
 * - Set up a baseline SIP into LARGE_CAP at month 0 to drive variance through
 *   market noise (different seeds → different NAVs → different final wealth).
 * - Auto-resolve pending events by paying.
 * - Boost the lowest-happiness dependent when blocked.
 */
function autoplay(seed: string): { state: GameState; elapsed: number } {
  const start = performance.now();
  let state = createNewRun(seed);
  state = {
    ...state,
    sips: [
      {
        id: 'sip-1',
        fundType: 'LARGE_CAP',
        monthlyAmount: 5_000 * PAISE_PER_RUPEE,
        active: true,
        startMonth: 0,
      },
    ],
  };

  let safety = 0;
  while (!state.isComplete && safety < 10_000) {
    const r = resolveTurn(state);
    if (r.requiresInput) {
      const pending = r.nextState.pendingEvent;
      if (pending) {
        const next = resolveTurn(r.nextState, {
          kind: 'RESOLVE_EVENT',
          templateId: pending.templateId,
          action: 'PAID',
        });
        state = next.nextState;
      } else {
        const lowest = r.nextState.dependents
          .filter((d) => d.happiness < 2000)
          .sort((a, b) => a.happiness - b.happiness)[0];
        if (lowest) {
          const boosted = resolveTurn(r.nextState, {
            kind: 'HAPPINESS_SPEND',
            dependentId: lowest.id,
            amountPaise: Math.min(r.nextState.cash, 50_000 * PAISE_PER_RUPEE),
          });
          state = boosted.nextState;
        } else {
          state = r.nextState;
        }
      }
    } else {
      state = r.nextState;
    }
    safety += 1;
  }
  return { state, elapsed: performance.now() - start };
}

describe('smoke — full 456-month simulation', () => {
  it('completes a full run with sane outputs', () => {
    const { state } = autoplay('smoke-seed');
    expect(state.isComplete).toBe(true);
    expect(state.month).toBe(456);
    expect(state.finalScore).not.toBeNull();
    expect(['S', 'A', 'B', 'C', 'D']).toContain(state.finalTier);
  });

  it('runs 10× same seed → identical final score', () => {
    const scores = Array.from({ length: 10 }, () => autoplay('repeat-seed').state.finalScore);
    expect(new Set(scores).size).toBe(1);
  });

  it('10 different seeds → at least 8 distinct outcomes (by net worth)', () => {
    const states = Array.from({ length: 10 }, (_, i) => autoplay(`seed-${i}`).state);
    const netWorths = states.map((s) => {
      const portfolio = s.investments.reduce((sum, inv) => {
        const navSeries = s.navHistory[inv.fundType];
        const nav = navSeries[navSeries.length - 1] ?? 0;
        return sum + (inv.isWithdrawn ? 0 : inv.unitsPurchased * nav);
      }, 0);
      return s.cash + Math.floor(portfolio);
    });
    const unique = new Set(netWorths);
    expect(unique.size).toBeGreaterThanOrEqual(8);
  });
});
