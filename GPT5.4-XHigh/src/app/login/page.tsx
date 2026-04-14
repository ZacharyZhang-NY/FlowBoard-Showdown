import { redirect } from "next/navigation";

import { getServerSession } from "@/src/shared/auth/session";
import { LoginScreen } from "@/src/shared/ui/login/LoginScreen";

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginScreen />;
}
