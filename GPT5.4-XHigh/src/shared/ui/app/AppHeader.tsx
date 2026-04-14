"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuButton,
  HeaderName,
} from "@carbon/react";
import { Logout, UserAvatarFilled } from "@carbon/icons-react";

import { authClient } from "@/src/lib/auth-client";

type AppHeaderProps = {
  userName: string;
  onMenuClick: () => void;
};

export function AppHeader({ userName, onMenuClick }: AppHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    });
  };

  return (
    <Header aria-label="FlowBoard">
      <HeaderMenuButton aria-label="Open navigation" onClick={onMenuClick} />
      <HeaderName href="/dashboard" prefix="">
        FlowBoard
      </HeaderName>
      <HeaderGlobalBar>
        <div className="flowboard-header__user">{userName}</div>
        <HeaderGlobalAction aria-label={userName} tooltipAlignment="end">
          <UserAvatarFilled />
        </HeaderGlobalAction>
        <HeaderGlobalAction
          aria-label="Sign out"
          onClick={() => {
            if (!isPending) {
              handleSignOut();
            }
          }}
          tooltipAlignment="end"
        >
          <Logout />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
}
