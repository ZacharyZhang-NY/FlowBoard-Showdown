"use client";

import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
} from "@carbon/react";
import { useTheme } from "./ThemeProvider";
import { useSession } from "@/lib/auth-client";

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();

  return (
    <Header aria-label="FlowBoard">
      <HeaderName prefix="">FlowBoard</HeaderName>
      <HeaderGlobalBar>
        <HeaderGlobalAction
          aria-label={theme === "g10" ? "Switch to dark mode" : "Switch to light mode"}
          onClick={toggleTheme}
          tooltipContent={theme === "g10" ? "Dark mode" : "Light mode"}
        >
          <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
            {theme === "g10" ? (
              <path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 25.5V4.5a11.5 11.5 0 0 1 0 23z" />
            ) : (
              <path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 25.5V4.5a11.5 11.5 0 0 1 0 23z" />
            )}
          </svg>
        </HeaderGlobalAction>
        {session?.user && (
          <HeaderGlobalAction
            aria-label={session.user.name}
            tooltipContent={session.user.name}
          >
            <span style={{ fontSize: 14 }}>
              {session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          </HeaderGlobalAction>
        )}
      </HeaderGlobalBar>
    </Header>
  );
}
