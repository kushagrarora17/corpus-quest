import {
  type GameState,
  type PlayerAction,
  type TurnEvent,
  createNewRun,
  resolveTurn,
} from '@corpus-quest/game-engine';
import type { Difficulty } from '@corpus-quest/shared';
import type { StateCreator } from 'zustand';

import {
  appendRunHistory,
  markDirty,
  saveRunState,
  setActiveRunId,
} from '../storage/runStorage';

export interface RunSlice {
  runId: string | null;
  state: GameState | null;
  lastEvents: TurnEvent[];
  requiresInput: boolean;
  /** Bump every turn so selectors that need to react can subscribe cheaply. */
  turnCounter: number;

  startNewRun: (seed: string, difficulty?: Difficulty) => void;
  loadExistingRun: (state: GameState) => void;
  advanceTurn: (action?: PlayerAction) => void;
  applyAction: (action: PlayerAction) => void;
  endRun: () => void;
  clear: () => void;
}

export const createRunSlice: StateCreator<RunSlice, [], [], RunSlice> = (set, get) => ({
  runId: null,
  state: null,
  lastEvents: [],
  requiresInput: false,
  turnCounter: 0,

  startNewRun: (seed, difficulty = 'NORMAL') => {
    const fresh = createNewRun(seed, difficulty);
    saveRunState(fresh.runId, fresh);
    setActiveRunId(fresh.runId);
    set({
      runId: fresh.runId,
      state: fresh,
      lastEvents: [],
      requiresInput: false,
      turnCounter: 0,
    });
  },

  loadExistingRun: (state) => {
    set({
      runId: state.runId,
      state,
      lastEvents: [],
      requiresInput: state.pendingEvent !== null,
      turnCounter: state.month,
    });
  },

  advanceTurn: (action) => {
    const current = get().state;
    if (!current || current.isComplete) return;
    const result = resolveTurn(current, action);
    saveRunState(result.nextState.runId, result.nextState);
    if (result.nextState.month > 0 && result.nextState.month % 12 === 0) {
      markDirty(result.nextState.runId);
    }
    set({
      state: result.nextState,
      lastEvents: result.events,
      requiresInput: result.requiresInput,
      turnCounter: result.nextState.month,
    });

    if (result.nextState.isComplete) {
      appendRunHistory({
        runId: result.nextState.runId,
        seed: result.nextState.seed,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        finalMonth: result.nextState.month,
        finalNetWorth: extractNetWorth(result.events),
        finalScore: result.nextState.finalScore,
        finalTier: result.nextState.finalTier,
        playerName: '',
      });
    }
  },

  applyAction: (action) => {
    const current = get().state;
    if (!current) return;
    const result = resolveTurn(current, action);
    saveRunState(result.nextState.runId, result.nextState);
    set({
      state: result.nextState,
      lastEvents: result.events,
      requiresInput: result.requiresInput,
    });
  },

  endRun: () => {
    set({ runId: null, state: null, lastEvents: [], requiresInput: false, turnCounter: 0 });
    setActiveRunId(null);
  },

  clear: () => {
    set({ runId: null, state: null, lastEvents: [], requiresInput: false, turnCounter: 0 });
  },
});

function extractNetWorth(events: TurnEvent[]): number | null {
  const complete = events.find((e) => e.kind === 'RUN_COMPLETE');
  if (!complete || !complete.detail) return null;
  const nw = complete.detail['netWorth'];
  return typeof nw === 'number' ? nw : null;
}
