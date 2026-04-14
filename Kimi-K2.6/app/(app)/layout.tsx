import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ThemeProvider } from "@/components/shell/ThemeProvider";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <ThemeProvider>
      <AppShell user={session?.user || null}>
        {children}
      </AppShell>
    </ThemeProvider>
  );
}
