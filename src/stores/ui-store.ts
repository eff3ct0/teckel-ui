"use client";

import { create } from "zustand";

interface UIState {
  isPaletteOpen: boolean;
  isConfigPanelOpen: boolean;
  isYamlPanelOpen: boolean;
  isYamlEditable: boolean;
  isExplainPanelOpen: boolean;
  isJobHistoryOpen: boolean;
  isTemplateGalleryOpen: boolean;

  togglePalette: () => void;
  toggleConfigPanel: () => void;
  toggleYamlPanel: () => void;
  setYamlEditable: (editable: boolean) => void;
  openConfigPanel: () => void;
  closeConfigPanel: () => void;
  openExplainPanel: () => void;
  closeExplainPanel: () => void;
  toggleExplainPanel: () => void;
  openJobHistory: () => void;
  closeJobHistory: () => void;
  toggleJobHistory: () => void;
  openTemplateGallery: () => void;
  closeTemplateGallery: () => void;
  toggleTemplateGallery: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPaletteOpen: true,
  isConfigPanelOpen: false,
  isYamlPanelOpen: false,
  isYamlEditable: false,
  isExplainPanelOpen: false,
  isJobHistoryOpen: false,
  isTemplateGalleryOpen: false,

  togglePalette: () => set((s) => ({ isPaletteOpen: !s.isPaletteOpen })),
  toggleConfigPanel: () => set((s) => ({ isConfigPanelOpen: !s.isConfigPanelOpen })),
  toggleYamlPanel: () => set((s) => ({ isYamlPanelOpen: !s.isYamlPanelOpen })),
  setYamlEditable: (editable) => set({ isYamlEditable: editable }),
  openConfigPanel: () => set({ isConfigPanelOpen: true }),
  closeConfigPanel: () => set({ isConfigPanelOpen: false }),
  openExplainPanel: () => set({ isExplainPanelOpen: true }),
  closeExplainPanel: () => set({ isExplainPanelOpen: false }),
  toggleExplainPanel: () => set((s) => ({ isExplainPanelOpen: !s.isExplainPanelOpen })),
  openJobHistory: () => set({ isJobHistoryOpen: true }),
  closeJobHistory: () => set({ isJobHistoryOpen: false }),
  toggleJobHistory: () => set((s) => ({ isJobHistoryOpen: !s.isJobHistoryOpen })),
  openTemplateGallery: () => set({ isTemplateGalleryOpen: true }),
  closeTemplateGallery: () => set({ isTemplateGalleryOpen: false }),
  toggleTemplateGallery: () => set((s) => ({ isTemplateGalleryOpen: !s.isTemplateGalleryOpen })),
}));
