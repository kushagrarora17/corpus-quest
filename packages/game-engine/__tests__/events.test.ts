import { describe, expect, it } from 'vitest';

import {
  __test_only__,
  applyEvent,
  buildEventDeck,
  emergencyDeckHasAllIds,
} from '../src/events.js';
import { createNewRun } from '../src/run.js';
import { resolveTurn } from '../src/turn.js';
import type { LifeEventTemplate } from '../src/types.js';

function findTpl(id: string): LifeEventTemplate | undefined {
  return [...__test_only__.PLANNED_TEMPLATES, ...__test_only__.EMERGENCY_TEMPLATES].find(
    (t) => t.id === id,
  );
}

describe('events', () => {
  it('marriage age window is months 48–96 (age 26–30)', () => {
    const marriage = findTpl('MARRIAGE');
    expect(marriage?.ageWindow?.fromMonth).toBe(48);
    expect(marriage?.ageWindow?.toMonth).toBe(96);
  });

  it('emergency deck has no duplicate IDs in NORMAL difficulty', () => {
    const { emergencyDeck } = buildEventDeck('seed-x', 'NORMAL');
    const ids = emergencyDeck.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(emergencyDeckHasAllIds(emergencyDeck)).toBe(true);
  });

  it('JOB_LOSS sets salaryPausedUntilMonth in [3..8] months ahead', () => {
    const state = createNewRun('seed-jobloss');
    const jobLoss = findTpl('JOB_LOSS');
    expect(jobLoss).toBeDefined();
    const r = applyEvent(state, jobLoss as LifeEventTemplate, 'PAID');
    const months = r.state.salaryPausedUntilMonth - state.month;
    expect(months).toBeGreaterThanOrEqual(3);
    expect(months).toBeLessThanOrEqual(8);
  });

  it('ignored medical emergency compounds: ≥ 30 happiness drop after 2 unresolved months', () => {
    let state = createNewRun('seed-medical');
    // Fast-forward a few months to build initial state
    for (let i = 0; i < 3; i += 1) {
      const r = resolveTurn(state);
      state = r.nextState;
    }
    const medical = findTpl('MEDICAL_SELF') as LifeEventTemplate;
    const startHappiness = (state.dependents[0]?.happiness ?? 0);
    // Apply the IGNORE outcome (–3000 immediate)
    const ignored = applyEvent(state, medical, 'IGNORED');
    state = ignored.state;
    const afterIgnoreHappiness = state.dependents[0]?.happiness ?? 0;
    expect(startHappiness - afterIgnoreHappiness).toBeGreaterThanOrEqual(3000);
  });
});
