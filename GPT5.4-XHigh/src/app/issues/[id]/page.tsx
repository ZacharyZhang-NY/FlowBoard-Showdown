import { Suspense } from "react";

import { AuthenticatedShell } from "@/src/shared/ui/app/AuthenticatedShell";
import { PageLoadingState } from "@/src/shared/ui/app/AsyncState";
import { ClientHydrationBoundary } from "@/src/shared/ui/app/ClientHydrationBoundary";
import { IssueDetailScreen } from "@/src/shared/ui/issues/IssueDetailScreen";

type IssueDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { id } = await params;

  return (
    <AuthenticatedShell>
      <Suspense fallback={<PageLoadingState description="Loading issue" />}>
        <ClientHydrationBoundary description="Loading issue">
          <IssueDetailScreen issueId={id} />
        </ClientHydrationBoundary>
      </Suspense>
    </AuthenticatedShell>
  );
}
