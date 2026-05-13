import { NextRequest, NextResponse } from "next/server";

/**
 * Edge-compatible middleware: redirects unauthenticated requests to /admin.
 *
 * We do a lightweight cookie check here (Edge runtime cannot import
 * firebase-admin). The server-side auth() call in app/admin/layout.tsx is
 * the authoritative gate — this is just an early redirect to avoid a flash.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    // NextAuth v5 session cookie (plain HTTP) or Secure (HTTPS/production).
    const hasSession =
      req.cookies.has("authjs.session-token") ||
      req.cookies.has("__Secure-authjs.session-token");

    if (!hasSession) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
