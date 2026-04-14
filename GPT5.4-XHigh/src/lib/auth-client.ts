import { createAuthClient } from "better-auth/react";

function resolveAuthClientBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL");
  }

  return baseUrl;
}

export const authClient = createAuthClient({
  baseURL: resolveAuthClientBaseUrl(),
});
