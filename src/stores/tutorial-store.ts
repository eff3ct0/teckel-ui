"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TutorialState {
  hasSeenTutorial: boolean;
  isOpen: boolean;
  step: number;
  open: () => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  goTo: (step: number) => void;
  markSeen: () => void;
}

export const TUTORIAL_STEPS = 5;

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      hasSeenTutorial: false,
      isOpen: false,
      step: 0,
      open: () => set({ isOpen: true, step: 0 }),
      close: () => set({ isOpen: false, hasSeenTutorial: true }),
      next: () =>
        set((s) => ({ step: Math.min(s.step + 1, TUTORIAL_STEPS - 1) })),
      prev: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
      goTo: (step) =>
        set({ step: Math.max(0, Math.min(step, TUTORIAL_STEPS - 1)) }),
      markSeen: () => set({ hasSeenTutorial: true }),
    }),
    {
      name: "teckel-tutorial",
      partialize: (s) => ({ hasSeenTutorial: s.hasSeenTutorial }),
    },
  ),
);
