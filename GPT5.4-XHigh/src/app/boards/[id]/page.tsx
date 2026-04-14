import { Suspense } from "react";

import { AuthenticatedShell } from "@/src/shared/ui/app/AuthenticatedShell";
import { PageLoadingState } from "@/src/shared/ui/app/AsyncState";
import { ClientHydrationBoundary } from "@/src/shared/ui/app/ClientHydrationBoundary";
import { BoardScreen } from "@/src/shared/ui/boards/BoardScreen";

type BoardPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params;

  return (
    <AuthenticatedShell>
      <Suspense fallback={<PageLoadingState description="Loading board" />}>
        <ClientHydrationBoundary description="Loading board">
          <BoardScreen boardId={id} />
        </ClientHydrationBoundary>
      </Suspense>
    </AuthenticatedShell>
  );
}
