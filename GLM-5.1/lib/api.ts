import { NextResponse } from "next/server";
import { auth } from "./auth";

export function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

export async function getAuthSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  return session;
}
