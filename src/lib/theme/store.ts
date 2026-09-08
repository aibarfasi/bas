"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";

type AppearanceState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

export const APPEARANCE_KEY = "bas-appearance";

export function applyAppearance(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  delete root.dataset.glass;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export const useAppearance = create<AppearanceState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme) => {
        applyAppearance(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const theme = get().theme === "dark" ? "light" : "dark";
        applyAppearance(theme);
        set({ theme });
      },
    }),
    {
      name: APPEARANCE_KEY,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyAppearance(state.theme);
      },
    },
  ),
);
