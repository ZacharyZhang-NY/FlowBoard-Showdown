"use client";

import { useEffect } from "react";
import { HeaderContainer, Content } from "@carbon/react";
import { AppHeader } from "@/components/shell/AppHeader";
import { AppSideNav } from "@/components/shell/AppSideNav";

interface AppShellProps {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null } | null;
}

function ShellContent({
  children,
  user,
  isSideNavExpanded,
  onClickSideNavExpand,
}: {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null } | null;
  isSideNavExpanded: boolean;
  onClickSideNavExpand: () => void;
}) {
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      const shouldExpand = window.innerWidth >= 1056;
      if (shouldExpand && !isSideNavExpanded) {
        onClickSideNavExpand();
      } else if (!shouldExpand && isSideNavExpanded) {
        onClickSideNavExpand();
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSideNavExpanded, onClickSideNavExpand]);

  return (
    <>
      <AppHeader
        user={user}
        isSideNavOpen={isSideNavExpanded}
        onMenuClick={onClickSideNavExpand}
      />
      <AppSideNav isOpen={isSideNavExpanded} />
      <Content style={{ padding: "2rem" }}>{children}</Content>
    </>
  );
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <HeaderContainer
      render={({ isSideNavExpanded, onClickSideNavExpand }) => (
        <ShellContent
          user={user}
          isSideNavExpanded={isSideNavExpanded}
          onClickSideNavExpand={onClickSideNavExpand}
        >
          {children}
        </ShellContent>
      )}
    />
  );
}
