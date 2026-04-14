import { Suspense } from "react";

import { AuthenticatedShell } from "@/src/shared/ui/app/AuthenticatedShell";
import { PageLoadingState } from "@/src/shared/ui/app/AsyncState";
import { ClientHydrationBoundary } from "@/src/shared/ui/app/ClientHydrationBoundary";
import { ReportsScreen } from "@/src/shared/ui/reports/ReportsScreen";

export default function ReportsPage() {
  return (
    <AuthenticatedShell>
      <Suspense fallback={<PageLoadingState description="Loading reports" />}>
        <ClientHydrationBoundary description="Loading reports">
          <ReportsScreen />
        </ClientHydrationBoundary>
      </Suspense>
    </AuthenticatedShell>
  );
}
