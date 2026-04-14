"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@carbon/react";

import { createQueryClient } from "@/src/state/query/query-client";
import { useUiStore } from "@/src/state/stores/ui-store";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const theme = useUiStore((state) => state.theme);
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === "g90" ? "dark" : "light";
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <Theme as="div" theme={theme}>
        {children}
      </Theme>
    </QueryClientProvider>
  );
}
