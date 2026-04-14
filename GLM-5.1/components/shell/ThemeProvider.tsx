"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Theme } from "@carbon/react";

type ThemeValue = "g10" | "g90";

interface ThemeContextValue {
  theme: ThemeValue;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "g10",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeValue>("g10");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("flowboard-theme");
    if (saved === "g90") {
      setTheme("g90");
    }
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "g10" ? "g90" : "g10";
      localStorage.setItem("flowboard-theme", next);
      return next;
    });
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Theme theme={theme}>
        {children}
      </Theme>
    </ThemeContext.Provider>
  );
}
