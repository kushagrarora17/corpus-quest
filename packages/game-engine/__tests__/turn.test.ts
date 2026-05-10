import { describe, expect, it } from 'vitest';

import { createNewRun } from '../src/run.js';
import { computeFinalScore } from '../src/score.js';
import { resolveTurn } from '../src/turn.js';
import type { GameState, PlayerAction } from '../src/types.js';

const PAISE_PER_RUPEE = 100;
const CRORE_INR = 10_000_000;

function fastForward(seed: string, action?: PlayerAction): GameState {
  let state = createNewRun(seed);
  let safety = 0;
  while (!state.isComplete && safety < 1000) {
    const r = resolveTurn(state, action);
    if (r.requiresInput) {
      // Auto-resolve any pending event by paying.
      if (state.pendingEvent || r.nextState.pendingEvent) {
        const pending = r.nextState.pendingEvent ?? state.pendingEvent;
        if (!pending) break;
        const next = resolveTurn(r.nextState, {
          kind: 'RESOLVE_EVENT',
          templateId: pending.templateId,
          action: 'PAID',
        });
        state = next.nextState;
        continue;
      }
      // Happiness block — boost SELF to clear it.
      if (r.nextState.dependents.some((d) => d.happiness < 2000)) {
        const dep = r.nextState.dependents.find((d) => d.happiness < 2000);
        if (dep) {
          const boosted = resolveTurn(r.nextState, {
            kind: 'HAPPINESS_SPEND',
            dependentId: dep.id,
            amountPaise: 50_000 * PAISE_PER_RUPEE,
          });
          state = boosted.nextState;
          continue;
        }
      }
      break;
    }
    state = r.nextState;
    safety += 1;
  }
  return state;
}

describe('turn pipeline', () => {
  it('salary credited before SIPs deducted', () => {
    let state = createNewRun('salary-test');
    // Set up an SIP that requires more cash than starting cash (₹0)
    state = {
      ...state,
      sips: [
        {
          id: 'sip-1',
          fundType: 'LIQUID',
          monthlyAmount: 1_000 * PAISE_PER_RUPEE,
          active: true,
          startMonth: 0,
        },
      ],
    };
    const r = resolveTurn(state);
    const kinds = r.events.map((e) => e.kind);
    const salaryIdx = kinds.indexOf('SALARY_CREDITED');
    const sipIdx = kinds.findIndex((k) => k === 'SIP_DEDUCTED' || k === 'SIP_SKIPPED');
    expect(salaryIdx).toBeGreaterThanOrEqual(0);
    expect(sipIdx).toBeGreaterThan(salaryIdx);
  });

  it('SIP skipped (with event) when cash is insufficient', () => {
    let state = createNewRun('sip-skip-test');
    // Salary is small; SIP is huge → skip after salary credit.
    state = {
      ...state,
      cash: 0,
      salary: 100,
      sips: [
        {
          id: 'sip-1',
          fundType: 'LIQUID',
          monthlyAmount: 10_00_000 * PAISE_PER_RUPEE,
          active: true,
          startMonth: 0,
        },
      ],
    };
    const r = resolveTurn(state);
    expect(r.events.some((e) => e.kind === 'SIP_SKIPPED')).toBe(true);
  });

  it('456-turn run completes well under the 30 s requirement', () => {
    // Warm-up — first run pays JIT/v8 compile cost on Windows CI.
    fastForward('perf-warmup');
    const start = performance.now();
    const state = fastForward('perf-seed');
    const elapsed = performance.now() - start;
    expect(state.isComplete).toBe(true);
    // Budget is generous for CI noise; SystemDesign §1 requires < 30 s on a
    // mid-range Android device, so 250 ms in Node on Windows is comfortable.
    expect(elapsed).toBeLessThan(250);
  });

  it('identical seeds → identical final scores', () => {
    const a = fastForward('same-seed-1');
    const b = fastForward('same-seed-1');
    expect(a.finalScore).toBe(b.finalScore);
    expect(a.finalTier).toBe(b.finalTier);
  });

  it('₹5 Cr + 80% happiness lands in tier A', () => {
    const fiveCrPaise = 5 * CRORE_INR * PAISE_PER_RUPEE;
    const { tier } = computeFinalScore(fiveCrPaise, 8000);
    expect(tier).toBe('A');
  });

  it('₹50L + 30% happiness lands in tier D', () => {
    const fiftyLPaise = 50 * 100_000 * PAISE_PER_RUPEE;
    const { tier } = computeFinalScore(fiftyLPaise, 3000);
    expect(tier).toBe('D');
  });

  it('completed run is no-op when called again', () => {
    let state = createNewRun('noop-seed');
    state = { ...state, isComplete: true };
    const r = resolveTurn(state);
    expect(r.nextState).toBe(state);
    expect(r.events).toHaveLength(0);
  });
});
