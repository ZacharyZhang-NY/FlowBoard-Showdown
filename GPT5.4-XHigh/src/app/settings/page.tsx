import { Suspense } from "react";

import { AuthenticatedShell } from "@/src/shared/ui/app/AuthenticatedShell";
import { PageLoadingState } from "@/src/shared/ui/app/AsyncState";
import { ClientHydrationBoundary } from "@/src/shared/ui/app/ClientHydrationBoundary";
import { SettingsScreen } from "@/src/shared/ui/settings/SettingsScreen";

export default function SettingsPage() {
  return (
    <AuthenticatedShell>
      <Suspense fallback={<PageLoadingState description="Loading settings" />}>
        <ClientHydrationBoundary description="Loading settings">
          <SettingsScreen />
        </ClientHydrationBoundary>
      </Suspense>
    </AuthenticatedShell>
  );
}
