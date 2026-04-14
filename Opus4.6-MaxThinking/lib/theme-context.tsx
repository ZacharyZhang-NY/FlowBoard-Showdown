"use client";

import { createContext, useContext } from "react";

type ThemeMode = "g10" | "g90";

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: "g10",
  setTheme: () => {},
});

export function useThemeContext() {
  return useContext(ThemeContext);
}
