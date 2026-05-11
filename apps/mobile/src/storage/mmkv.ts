import { MMKV } from 'react-native-mmkv';

/**
 * Single MMKV instance shared by every module. We use a named id so multiple
 * Corpus Quest instances (e.g. dev + production builds installed side-by-side)
 * keep their stores isolated.
 */
export const storage = new MMKV({ id: 'corpus-quest:v1' });

export const Keys = {
  activeRunId: 'active_run_id',
  runState: (runId: string) => `run:${runId}:state`,
  runDirty: (runId: string) => `run:${runId}:dirty`,
  runHistory: 'run_history',
  authSession: 'auth_session',
  tutorialStep: 'tutorial:step',
  tutorialComplete: 'tutorial:complete',
  playerName: 'player_name',
} as const;
