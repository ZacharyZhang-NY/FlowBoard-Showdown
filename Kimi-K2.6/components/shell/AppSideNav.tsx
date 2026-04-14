"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SideNav,
  SideNavItems,
  SideNavLink,
} from "@carbon/react";
import {
  Dashboard,
  TaskTools,
  ListBulleted,
  Calendar,
  ChartColumn,
  Settings,
} from "@carbon/icons-react";

export function AppSideNav({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Dashboard },
    { href: "/boards", label: "Boards", icon: TaskTools },
    { href: "/issues", label: "Issues", icon: ListBulleted },
    { href: "/sprints", label: "Sprints", icon: Calendar },
    { href: "/reports", label: "Reports", icon: ChartColumn },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <SideNav aria-label="Main navigation" isRail expanded={isOpen}>
      <SideNavItems>
        {navItems.map((item) => (
          <SideNavLink
            key={item.href}
            as={Link}
            href={item.href}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            renderIcon={item.icon}
          >
            {item.label}
          </SideNavLink>
        ))}
      </SideNavItems>
    </SideNav>
  );
}
