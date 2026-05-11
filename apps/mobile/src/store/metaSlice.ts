import type { StateCreator } from 'zustand';

import { type RunSummary, loadRunHistory } from '../storage/runStorage';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface LeaderboardEntry {
  playerId: string;
  runId: string;
  displayName: string;
  netWorth: number;
  score: number;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface MetaSlice {
  runHistory: RunSummary[];
  leaderboardCache: LeaderboardEntry[];
  authUser: AuthUser | null;

  hydrateRunHistory: () => void;
  setAuthUser: (user: AuthUser | null) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
}

export const createMetaSlice: StateCreator<MetaSlice, [], [], MetaSlice> = (set) => ({
  runHistory: [],
  leaderboardCache: [],
  authUser: null,

  hydrateRunHistory: () => set({ runHistory: loadRunHistory() }),
  setAuthUser: (user) => set({ authUser: user }),
  setLeaderboard: (entries) => set({ leaderboardCache: entries }),
});
