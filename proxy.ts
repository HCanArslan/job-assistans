import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

/**
 * Protects the whole /app area at the network boundary (Next.js 16 proxy).
 * Everything under /app requires a valid signed session cookie.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token).catch(() => null) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/app") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }
    loginUrl.searchParams.set("reason", "auth");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app", "/app/(.*)"],
};
