import { Suspense } from "react";

import { AuthenticatedShell } from "@/src/shared/ui/app/AuthenticatedShell";
import { PageLoadingState } from "@/src/shared/ui/app/AsyncState";
import { ClientHydrationBoundary } from "@/src/shared/ui/app/ClientHydrationBoundary";
import { SprintsScreen } from "@/src/shared/ui/sprints/SprintsScreen";

export default function SprintsPage() {
  return (
    <AuthenticatedShell>
      <Suspense fallback={<PageLoadingState description="Loading sprints" />}>
        <ClientHydrationBoundary description="Loading sprints">
          <SprintsScreen />
        </ClientHydrationBoundary>
      </Suspense>
    </AuthenticatedShell>
  );
}
