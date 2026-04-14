"use client";

import { useEffect, type ReactNode } from "react";
import { Content } from "@carbon/react";

import type { AuthenticatedSession } from "@/src/shared/types/session";
import { useProjectsQuery } from "@/src/state/query/useProjects";
import { useUiStore } from "@/src/state/stores/ui-store";
import { AppHeader } from "@/src/shared/ui/app/AppHeader";
import { AppSideNav } from "@/src/shared/ui/app/AppSideNav";

type AppShellProps = {
  session: AuthenticatedSession;
  children: ReactNode;
};

export function AppShell({ session, children }: AppShellProps) {
  const sideNavExpanded = useUiStore((state) => state.sideNavExpanded);
  const toggleSideNav = useUiStore((state) => state.toggleSideNav);
  const setSideNavExpanded = useUiStore((state) => state.setSideNavExpanded);
  const activeProjectId = useUiStore((state) => state.activeProjectId);
  const setActiveProjectId = useUiStore((state) => state.setActiveProjectId);
  const projectsQuery = useProjectsQuery();

  useEffect(() => {
    const firstProjectId = projectsQuery.data?.[0]?.id ?? null;
    if (!activeProjectId && firstProjectId) {
      setActiveProjectId(firstProjectId);
    }
  }, [activeProjectId, projectsQuery.data, setActiveProjectId]);

  return (
    <div className="flowboard-shell">
      <AppHeader onMenuClick={toggleSideNav} userName={session.user.name} />
      <AppSideNav
        expanded={sideNavExpanded}
        onOverlayClick={() => {
          setSideNavExpanded(false);
        }}
      />
      <Content className="flowboard-shell__content" id="main-content">
        {children}
      </Content>
    </div>
  );
}
