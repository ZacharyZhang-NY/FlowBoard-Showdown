"use client";

import { usePathname } from "next/navigation";
import {
  SideNav,
  SideNavItems,
  SideNavLink,
} from "@carbon/react";
import {
  Dashboard,
  Template as BoardIcon,
  Task,
  Timer as SprintIcon,
  ChartMultitype,
  Settings,
} from "@carbon/icons-react";

type AppSideNavProps = {
  isExpanded: boolean;
  projectId?: string;
  boardId?: string;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Dashboard },
  { href: "/boards", label: "Boards", icon: BoardIcon },
  { href: "/issues", label: "Issues", icon: Task },
  { href: "/sprints", label: "Sprints", icon: SprintIcon },
  { href: "/reports", label: "Reports", icon: ChartMultitype },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppSideNav({ isExpanded }: AppSideNavProps) {
  const pathname = usePathname();

  return (
    <SideNav
      aria-label="Side navigation"
      isRail={false}
      expanded={isExpanded}
      isFixedNav
    >
      <SideNavItems>
        {NAV_ITEMS.map((item) => (
          <SideNavLink
            key={item.href}
            href={item.href}
            renderIcon={item.icon}
            isActive={pathname.startsWith(item.href)}
          >
            {item.label}
          </SideNavLink>
        ))}
      </SideNavItems>
    </SideNav>
  );
}
