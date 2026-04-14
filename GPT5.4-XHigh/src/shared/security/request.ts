import { headers } from "next/headers";

export const requestIdHeader = "x-flowboard-request-id";

export function createRequestId(): string {
  return crypto.randomUUID();
}

export async function getRequestIdFromHeaders(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get(requestIdHeader) ?? createRequestId();
}
