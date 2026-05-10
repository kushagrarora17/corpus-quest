import {
  STARTING_HAPPINESS,
  STARTING_SALARY_MAX_PAISE,
  STARTING_SALARY_MIN_PAISE,
} from '@corpus-quest/shared';
import type { Difficulty } from '@corpus-quest/shared';

import { buildEventDeck } from './events.js';
import { createInitialMarketState, createInitialNAVHistory } from './market.js';
import { rngInt } from './rng.js';
import type { GameState } from './types.js';

export function createNewRun(seed: string, difficulty: Difficulty = 'NORMAL'): GameState {
  const salary = rngInt(
    seed,
    0,
    'starting-salary',
    STARTING_SALARY_MIN_PAISE,
    STARTING_SALARY_MAX_PAISE,
  );

  const { plannedEvents, emergencyDeck } = buildEventDeck(seed, difficulty);

  return {
    runId: `run-${seed}`,
    seed,
    difficulty,
    month: 0,
    cash: 0,
    salary,
    salaryPausedUntilMonth: 0,
    portfolio: [],
    investments: [],
    navHistory: createInitialNAVHistory(),
    sips: [],
    dependents: [
      {
        id: 'self',
        type: 'SELF',
        name: 'You',
        happiness: STARTING_HAPPINESS,
        joinedMonth: 0,
      },
    ],
    committedEMIs: [],
    eventDeck: emergencyDeck,
    plannedEvents,
    triggeredEvents: [],
    pendingEvent: null,
    marketState: createInitialMarketState(seed),
    happinessLog: [],
    isComplete: false,
    finalScore: null,
    finalTier: null,
  };
}
