"use client";

import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderMenuButton,
} from "@carbon/react";
import { UserAvatarFilledAlt } from "@carbon/icons-react";
import { authClient } from "@/lib/auth-client";

interface AppHeaderProps {
  user?: { name?: string | null; email?: string | null } | null;
  isSideNavOpen?: boolean;
  onMenuClick?: () => void;
}

export function AppHeader({ user, isSideNavOpen, onMenuClick }: AppHeaderProps) {
  return (
    <Header aria-label="FlowBoard">
      <HeaderMenuButton
        aria-label="Open menu"
        isActive={isSideNavOpen}
        onClick={onMenuClick}
        aria-expanded={isSideNavOpen}
      />
      <HeaderName href="/dashboard" prefix="">
        FlowBoard
      </HeaderName>
      <HeaderGlobalBar>
        <HeaderGlobalAction
          aria-label={user?.name || "User"}
          tooltipAlignment="end"
          onClick={() => authClient.signOut()}
        >
          <UserAvatarFilledAlt size={20} />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
}
