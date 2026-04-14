import { Suspense } from "react";

import { AuthenticatedShell } from "@/src/shared/ui/app/AuthenticatedShell";
import { PageLoadingState } from "@/src/shared/ui/app/AsyncState";
import { ClientHydrationBoundary } from "@/src/shared/ui/app/ClientHydrationBoundary";
import { IssuesScreen } from "@/src/shared/ui/issues/IssuesScreen";

export default function IssuesPage() {
  return (
    <AuthenticatedShell>
      <Suspense fallback={<PageLoadingState description="Loading issues" />}>
        <ClientHydrationBoundary description="Loading issues">
          <IssuesScreen />
        </ClientHydrationBoundary>
      </Suspense>
    </AuthenticatedShell>
  );
}
