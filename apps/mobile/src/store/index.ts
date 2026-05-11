import { create } from 'zustand';

import { type MetaSlice, createMetaSlice } from './metaSlice';
import { type RunSlice, createRunSlice } from './runSlice';
import { type UISlice, createUISlice } from './uiSlice';

export type AppStore = RunSlice & UISlice & MetaSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createRunSlice(...a),
  ...createUISlice(...a),
  ...createMetaSlice(...a),
}));

// Convenience selectors — keeping these together avoids re-render churn.
export const selectGameState = (s: AppStore) => s.state;
export const selectRequiresInput = (s: AppStore) => s.requiresInput;
export const selectPendingEvent = (s: AppStore) => s.state?.pendingEvent ?? null;
export const selectDependents = (s: AppStore) => s.state?.dependents ?? [];
export const selectCash = (s: AppStore) => s.state?.cash ?? 0;
export const selectMonth = (s: AppStore) => s.state?.month ?? 0;
