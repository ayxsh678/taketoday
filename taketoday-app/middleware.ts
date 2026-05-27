import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't need auth
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/verify-2fa", "/api/admin/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin and /api/admin routes
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdminRoute) return NextResponse.next();

  // Allow public admin paths (login, health check)
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Validate session at edge
  const session = await auth();

  if (!session?.user?.isAdmin) {
    // API routes → 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    // Page routes → redirect to login
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Attach role to request headers so downstream handlers can read without re-fetching session
  const response = NextResponse.next();
  if (session.user.role) {
    response.headers.set("x-admin-role", session.user.role);
    response.headers.set("x-admin-id", session.user.id ?? "");
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
