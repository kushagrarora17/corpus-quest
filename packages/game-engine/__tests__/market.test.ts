import { describe, expect, it } from 'vitest';

import {
  STARTING_NAV_PAISE,
  advanceMarketState,
  computeMonthlyReturn,
  createInitialMarketState,
  createInitialNAVHistory,
  generateEventSequence,
  updateNAVs,
} from '../src/market.js';
import type { MarketState, NAVHistory } from '../src/types.js';

function runNAVs(seed: string, months: number, marketState: MarketState): NAVHistory {
  let history = createInitialNAVHistory();
  let state = marketState;
  for (let m = 0; m < months; m += 1) {
    state = advanceMarketState(state, m);
    history = updateNAVs(history, state, m, seed);
  }
  return history;
}

describe('market', () => {
  it('liquid fund stays in 5–6% p.a. range over 456 months with no events', () => {
    const empty: MarketState = {
      regime: 'STEADY',
      upcomingEvents: [],
      activeEvents: [],
      pastEvents: [],
    };
    const h = runNAVs('liquid-test', 456, empty);
    const liquid = h.LIQUID;
    const final = liquid[liquid.length - 1] as number;
    const cagr = Math.pow(final / STARTING_NAV_PAISE, 12 / 456) - 1;
    expect(cagr).toBeGreaterThanOrEqual(0.05);
    expect(cagr).toBeLessThanOrEqual(0.06);
  });

  it('GREAT_FREEZE drops Large Cap NAV by ≥ 40%', () => {
    // Force a single freeze event by constructing the market state directly.
    const freeze: MarketState = {
      regime: 'BEAR',
      upcomingEvents: [],
      activeEvents: [
        {
          type: 'GREAT_FREEZE',
          startMonth: 0,
          durationMonths: 12,
          modifiers: {
            LIQUID: 0,
            DEBT: 0,
            HYBRID: -0.02,
            LARGE_CAP: -0.05,
            SMALL_MID_CAP: -0.07,
          },
        },
      ],
      pastEvents: [],
    };
    let history = createInitialNAVHistory();
    let state = freeze;
    for (let m = 0; m < 12; m += 1) {
      state = advanceMarketState(state, m);
      history = updateNAVs(history, state, m, 'freeze');
    }
    const final = (history.LARGE_CAP[history.LARGE_CAP.length - 1] as number) / STARTING_NAV_PAISE;
    expect(1 - final).toBeGreaterThanOrEqual(0.4);
  });

  it('identical seeds produce identical NAV histories', () => {
    const s1 = createInitialMarketState('seed-A');
    const s2 = createInitialMarketState('seed-A');
    const h1 = runNAVs('seed-A', 100, s1);
    const h2 = runNAVs('seed-A', 100, s2);
    expect(h1).toEqual(h2);
  });

  it('different seeds produce different NAV histories', () => {
    const h1 = runNAVs('seed-A', 100, createInitialMarketState('seed-A'));
    const h2 = runNAVs('seed-B', 100, createInitialMarketState('seed-B'));
    expect(h1.LARGE_CAP[60]).not.toBe(h2.LARGE_CAP[60]);
  });

  it('generates 4–6 events with ≥ 24 months spacing', () => {
    const evs = generateEventSequence('event-spacing-seed');
    expect(evs.length).toBeGreaterThanOrEqual(4);
    expect(evs.length).toBeLessThanOrEqual(6);
    for (let i = 1; i < evs.length; i += 1) {
      const prev = evs[i - 1] as { startMonth: number };
      const cur = evs[i] as { startMonth: number };
      expect(Math.abs(cur.startMonth - prev.startMonth)).toBeGreaterThanOrEqual(24);
    }
  });

  it('computeMonthlyReturn equals base + noise when no active events', () => {
    const empty: MarketState = {
      regime: 'STEADY',
      upcomingEvents: [],
      activeEvents: [],
      pastEvents: [],
    };
    const r = computeMonthlyReturn('LIQUID', 5, empty, 'seed');
    // Liquid base = 5.5%/12 ≈ 0.00458, noise amp = 0.002
    expect(r).toBeGreaterThan(0.00458 - 0.0021);
    expect(r).toBeLessThan(0.00458 + 0.0021);
  });
});
