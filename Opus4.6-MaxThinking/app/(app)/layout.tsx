"use client";

import { useState } from "react";
import AppHeader from "@/components/shell/AppHeader";
import AppSideNav from "@/components/shell/AppSideNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSideNavExpanded, setIsSideNavExpanded] = useState(true);

  return (
    <>
      <AppHeader
        isSideNavExpanded={isSideNavExpanded}
        onToggleSideNav={() => setIsSideNavExpanded(!isSideNavExpanded)}
      />
      <div className="app-shell">
        <AppSideNav isExpanded={isSideNavExpanded} />
        <main className="app-content">{children}</main>
      </div>
    </>
  );
}
