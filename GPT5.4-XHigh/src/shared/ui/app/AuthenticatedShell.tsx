import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getServerSession } from "@/src/shared/auth/session";
import { AppShell } from "@/src/shared/ui/app/AppShell";

type AuthenticatedShellProps = {
  children: ReactNode;
};

export async function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <AppShell session={session}>{children}</AppShell>;
}
