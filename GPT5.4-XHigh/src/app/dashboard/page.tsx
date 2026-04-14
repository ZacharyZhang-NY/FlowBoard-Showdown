import { Suspense } from "react";

import { AuthenticatedShell } from "@/src/shared/ui/app/AuthenticatedShell";
import { PageLoadingState } from "@/src/shared/ui/app/AsyncState";
import { ClientHydrationBoundary } from "@/src/shared/ui/app/ClientHydrationBoundary";
import { DashboardScreen } from "@/src/shared/ui/dashboard/DashboardScreen";

export default function DashboardPage() {
  return (
    <AuthenticatedShell>
      <Suspense fallback={<PageLoadingState description="Loading dashboard" />}>
        <ClientHydrationBoundary description="Loading dashboard">
          <DashboardScreen />
        </ClientHydrationBoundary>
      </Suspense>
    </AuthenticatedShell>
  );
}
