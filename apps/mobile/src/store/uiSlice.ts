import type { StateCreator } from 'zustand';

export type TabName =
  | 'dashboard'
  | 'portfolio'
  | 'invest'
  | 'events'
  | 'family'
  | 'market'
  | 'stats';

export interface Toast {
  id: string;
  message: string;
  level: 'info' | 'success' | 'warn' | 'error';
}

export interface UISlice {
  activeTab: TabName;
  toastQueue: Toast[];
  glossaryOpen: boolean;
  glossaryTerm: string | null;
  tutorialOverlay: number | null;

  setActiveTab: (tab: TabName) => void;
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  openGlossary: (term?: string) => void;
  closeGlossary: () => void;
  setTutorialOverlay: (step: number | null) => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  activeTab: 'dashboard',
  toastQueue: [],
  glossaryOpen: false,
  glossaryTerm: null,
  tutorialOverlay: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  pushToast: (toast) =>
    set((s) => ({
      toastQueue: [...s.toastQueue, { ...toast, id: `t-${Date.now()}-${Math.random()}` }],
    })),
  dismissToast: (id) => set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),
  openGlossary: (term) => set({ glossaryOpen: true, glossaryTerm: term ?? null }),
  closeGlossary: () => set({ glossaryOpen: false, glossaryTerm: null }),
  setTutorialOverlay: (step) => set({ tutorialOverlay: step }),
});
