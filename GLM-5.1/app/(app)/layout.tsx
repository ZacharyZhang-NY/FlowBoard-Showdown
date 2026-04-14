import { AppHeader } from "@/components/shell/AppHeader";
import { AppSideNav } from "@/components/shell/AppSideNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <AppSideNav />
      <main className="cds--content" style={{ padding: "0 48px 48px 48px", marginTop: 48 }}>
        {children}
      </main>
    </>
  );
}
