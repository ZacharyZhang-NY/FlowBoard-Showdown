"use client";

import "./globals.scss";
import { useState } from "react";
import { Theme } from "@carbon/react";
import { ThemeContext } from "@/lib/theme-context";

type ThemeMode = "g10" | "g90";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("flowboard-theme") as ThemeMode) || "g10";
    }
    return "g10";
  });

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("flowboard-theme", newTheme);
    }
  };

  return (
    <html lang="en" data-carbon-theme={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>FlowBoard</title>
      </head>
      <body>
        <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
          <Theme theme={theme}>{children}</Theme>
        </ThemeContext.Provider>
      </body>
    </html>
  );
}
