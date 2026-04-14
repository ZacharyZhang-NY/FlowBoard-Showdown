import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ZodError, ZodSchema } from "zod";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getAuthSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    throw new AuthError("Unauthorized");
  }
  return session;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return errorResponse("Unauthorized", 401);
  }
  if (error instanceof ZodError) {
    const message = error.errors.map((e) => e.message).join(", ");
    return errorResponse(message, 400);
  }
  console.error("API Error:", error);
  return errorResponse("Internal server error", 500);
}

export function validateBody<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
