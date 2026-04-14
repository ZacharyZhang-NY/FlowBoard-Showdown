"use client";

import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderMenuButton,
} from "@carbon/react";
import { Logout, UserAvatar, Light, Asleep } from "@carbon/icons-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useThemeContext } from "@/lib/theme-context";

type AppHeaderProps = {
  isSideNavExpanded: boolean;
  onToggleSideNav: () => void;
};

export default function AppHeader({
  isSideNavExpanded,
  onToggleSideNav,
}: AppHeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useThemeContext();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  function handleToggleTheme() {
    setTheme(theme === "g10" ? "g90" : "g10");
  }

  return (
    <Header aria-label="FlowBoard">
      <HeaderMenuButton
        aria-label="Toggle navigation"
        isActive={isSideNavExpanded}
        onClick={onToggleSideNav}
      />
      <HeaderName href="/dashboard" prefix="">
        FlowBoard
      </HeaderName>
      <HeaderGlobalBar>
        <HeaderGlobalAction
          aria-label="Toggle theme"
          onClick={handleToggleTheme}
        >
          {theme === "g10" ? <Asleep size={20} /> : <Light size={20} />}
        </HeaderGlobalAction>
        <HeaderGlobalAction aria-label="User">
          <UserAvatar size={20} />
        </HeaderGlobalAction>
        <HeaderGlobalAction aria-label="Sign out" onClick={handleSignOut}>
          <Logout size={20} />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
}
