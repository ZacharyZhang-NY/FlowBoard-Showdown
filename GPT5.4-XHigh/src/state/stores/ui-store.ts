"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ThemeMode } from "@/src/shared/types/domain";

type UiStoreState = {
  theme: ThemeMode;
  sideNavExpanded: boolean;
  activeProjectId: string | null;
  setTheme: (theme: ThemeMode) => void;
  setSideNavExpanded: (expanded: boolean) => void;
  toggleSideNav: () => void;
  setActiveProjectId: (projectId: string | null) => void;
};

export const useUiStore = create<UiStoreState>()(
  persist(
    (set) => ({
      theme: "g10",
      sideNavExpanded: true,
      activeProjectId: null,
      setTheme: (theme) => {
        set({ theme });
      },
      setSideNavExpanded: (sideNavExpanded) => {
        set({ sideNavExpanded });
      },
      toggleSideNav: () => {
        set((state) => ({ sideNavExpanded: !state.sideNavExpanded }));
      },
      setActiveProjectId: (activeProjectId) => {
        set({ activeProjectId });
      },
    }),
    {
      name: "flowboard-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        activeProjectId: state.activeProjectId,
      }),
    },
  ),
);
