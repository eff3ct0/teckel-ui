"use client";

import { create } from "zustand";

interface UIState {
  isPaletteOpen: boolean;
  isConfigPanelOpen: boolean;
  isYamlPanelOpen: boolean;
  isYamlEditable: boolean;

  togglePalette: () => void;
  toggleConfigPanel: () => void;
  toggleYamlPanel: () => void;
  setYamlEditable: (editable: boolean) => void;
  openConfigPanel: () => void;
  closeConfigPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPaletteOpen: true,
  isConfigPanelOpen: false,
  isYamlPanelOpen: false,
  isYamlEditable: false,

  togglePalette: () => set((s) => ({ isPaletteOpen: !s.isPaletteOpen })),
  toggleConfigPanel: () => set((s) => ({ isConfigPanelOpen: !s.isConfigPanelOpen })),
  toggleYamlPanel: () => set((s) => ({ isYamlPanelOpen: !s.isYamlPanelOpen })),
  setYamlEditable: (editable) => set({ isYamlEditable: editable }),
  openConfigPanel: () => set({ isConfigPanelOpen: true }),
  closeConfigPanel: () => set({ isConfigPanelOpen: false }),
}));
