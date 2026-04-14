"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SideNav, SideNavItems, SideNavLink } from "@carbon/react";
import {
  ChartLine,
  Dashboard,
  ListBoxes,
  Settings,
  Task,
} from "@carbon/icons-react";

type AppSideNavProps = {
  expanded: boolean;
  onOverlayClick: () => void;
};

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Dashboard },
  { href: "/issues", label: "Issues", icon: Task },
  { href: "/sprints", label: "Sprints", icon: ListBoxes },
  { href: "/reports", label: "Reports", icon: ChartLine },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSideNav({ expanded, onOverlayClick }: AppSideNavProps) {
  const pathname = usePathname();

  return (
    <SideNav
      aria-label="FlowBoard navigation"
      expanded={expanded}
      isChildOfHeader={false}
      onOverlayClick={onOverlayClick}
    >
      <SideNavItems>
        {items.map((item) => (
          <SideNavLink
            as={Link}
            href={item.href}
            isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            key={item.href}
            renderIcon={item.icon}
          >
            {item.label}
          </SideNavLink>
        ))}
      </SideNavItems>
    </SideNav>
  );
}
