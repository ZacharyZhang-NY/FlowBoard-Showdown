"use client";

import { usePathname } from "next/navigation";
import {
  SideNav,
  SideNavItems,
  SideNavLink,
} from "@carbon/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/boards", label: "Boards", icon: "category" },
  { href: "/issues", label: "Issues", icon: "table" },
  { href: "/sprints", label: "Sprints", icon: "group" },
  { href: "/reports", label: "Reports", icon: "chart" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function AppSideNav() {
  const pathname = usePathname();

  return (
    <SideNav aria-label="Main navigation" isFixedNav expanded>
      <SideNavItems>
        {navItems.map((item) => (
          <SideNavLink
            key={item.href}
            href={item.href}
            isActive={pathname.startsWith(item.href)}
          >
            {item.label}
          </SideNavLink>
        ))}
      </SideNavItems>
    </SideNav>
  );
}
