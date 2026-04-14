import { headers as nextHeaders } from "next/headers";

import { auth } from "@/src/lib/auth";
import { authRequired } from "@/src/shared/api/errors";
import type { AuthenticatedSession } from "@/src/shared/types/session";

type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

function mapSession(sessionData: NonNullable<BetterAuthSession>): AuthenticatedSession {
  const role = sessionData.user.role;
  if (!role) {
    throw new Error("Authenticated user is missing role");
  }

  return {
    sessionId: sessionData.session.id,
    expiresAt: new Date(sessionData.session.expiresAt).toISOString(),
    user: {
      id: sessionData.user.id,
      name: sessionData.user.name,
      email: sessionData.user.email,
      role,
      image: sessionData.user.image ?? null,
    },
  };
}

export async function getRequestSession(
  requestHeaders: Headers,
): Promise<AuthenticatedSession | null> {
  const sessionData = await auth.api.getSession({
    headers: requestHeaders,
  });

  return sessionData ? mapSession(sessionData) : null;
}

export async function requireRequestSession(
  requestHeaders: Headers,
): Promise<AuthenticatedSession> {
  const currentSession = await getRequestSession(requestHeaders);
  if (!currentSession) {
    throw authRequired();
  }

  return currentSession;
}

export async function getServerSession(): Promise<AuthenticatedSession | null> {
  const requestHeaders = await nextHeaders();
  return getRequestSession(new Headers(requestHeaders));
}
