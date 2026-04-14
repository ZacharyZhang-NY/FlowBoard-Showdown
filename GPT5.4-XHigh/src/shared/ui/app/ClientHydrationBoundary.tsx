"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { PageLoadingState } from "@/src/shared/ui/app/AsyncState";

type ClientHydrationBoundaryProps = {
  children: ReactNode;
  description: string;
};

export function ClientHydrationBoundary({
  children,
  description,
}: ClientHydrationBoundaryProps) {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!hydrated) {
    return <PageLoadingState description={description} />;
  }

  return <>{children}</>;
}
