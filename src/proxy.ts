import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "interview_me";

/**
 * Gate every page request.
 * Skip: /auth itself, /api/auth/*, /config.json, and static assets.
 */
export default function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Allow public paths
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/web-api/auth") ||
    pathname === "/config.json" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie) {
    return NextResponse.next();
  }

  // Direct link with access code
  const code = searchParams.get("code");
  if (code) {
    return NextResponse.redirect(new URL(`/auth?code=${encodeURIComponent(code)}`, request.url));
  }

  return NextResponse.redirect(new URL("/auth", request.url));
}

export const config = {
  matcher: "/((?!_next/static|_next/image).*)",
};
