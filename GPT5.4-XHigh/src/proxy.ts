import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const publicPrefixes = [
  "/login",
  "/api/auth",
  "/api/docs",
  "/api/health",
  "/api/metrics",
];

function isPublicPath(pathname: string): boolean {
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images") ||
    isPublicPath(pathname)
  ) {
    return NextResponse.next();
  }

  const sessionToken = getSessionCookie(request.headers);
  if (sessionToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const redirectTo = pathname === "/" ? "/dashboard" : `${pathname}${search}`;
  loginUrl.searchParams.set("redirectTo", redirectTo);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
