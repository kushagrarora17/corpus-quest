import type { GameState, ScoreTier } from '@corpus-quest/game-engine';

import { Keys, storage } from './mmkv';

export interface RunSummary {
  runId: string;
  seed: string;
  startedAt: string;
  completedAt: string | null;
  finalMonth: number | null;
  finalNetWorth: number | null;
  finalScore: number | null;
  finalTier: ScoreTier | null;
  playerName: string;
}

/** Persist a single turn's GameState to MMKV. Called from `advanceTurn`. */
export function saveRunState(runId: string, state: GameState): void {
  storage.set(Keys.runState(runId), JSON.stringify(state));
}

export function loadRunState(runId: string): GameState | null {
  const raw = storage.getString(Keys.runState(runId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function clearRunState(runId: string): void {
  storage.delete(Keys.runState(runId));
  storage.delete(Keys.runDirty(runId));
}

export function getActiveRunId(): string | null {
  return storage.getString(Keys.activeRunId) ?? null;
}

export function setActiveRunId(runId: string | null): void {
  if (runId === null) {
    storage.delete(Keys.activeRunId);
  } else {
    storage.set(Keys.activeRunId, runId);
  }
}

export function saveRunHistory(history: RunSummary[]): void {
  storage.set(Keys.runHistory, JSON.stringify(history));
}

export function loadRunHistory(): RunSummary[] {
  const raw = storage.getString(Keys.runHistory);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as RunSummary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendRunHistory(summary: RunSummary, max = 10): void {
  const current = loadRunHistory().filter((r) => r.runId !== summary.runId);
  const next = [summary, ...current].slice(0, max);
  saveRunHistory(next);
}

export function markDirty(runId: string): void {
  storage.set(Keys.runDirty(runId), true);
}

export function clearDirty(runId: string): void {
  storage.delete(Keys.runDirty(runId));
}

export function isDirty(runId: string): boolean {
  return storage.getBoolean(Keys.runDirty(runId)) ?? false;
}

export function getPlayerName(): string {
  return storage.getString(Keys.playerName) ?? '';
}

export function setPlayerName(name: string): void {
  storage.set(Keys.playerName, name);
}

export function getTutorialStep(): number {
  return storage.getNumber(Keys.tutorialStep) ?? 0;
}

export function setTutorialStep(step: number): void {
  storage.set(Keys.tutorialStep, step);
}

export function isTutorialComplete(): boolean {
  return storage.getBoolean(Keys.tutorialComplete) ?? false;
}

export function setTutorialComplete(complete: boolean): void {
  storage.set(Keys.tutorialComplete, complete);
}
