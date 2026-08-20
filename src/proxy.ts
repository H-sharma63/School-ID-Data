import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");
  const isAuthApiRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublicAsset = req.nextUrl.pathname.match(/\.(svg|png|ico|woff2)$/);
  const isRoot = req.nextUrl.pathname === "/";
  const isQuick = req.nextUrl.pathname === "/quick";

  // Allow public assets, landing page (root), and quick export without auth
  if (isPublicAsset || isRoot || isQuick) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isAuthRoute && !isAuthApiRoute) {
    const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.url));
  }

  // Redirect authenticated users from landing (/) to dashboard
  if (isLoggedIn && isRoot) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isLoggedIn && isAuthRoute && req.nextUrl.pathname === "/auth/signin") {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "/dashboard";
    return NextResponse.redirect(new URL(callbackUrl, req.url));
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$|.*\\.woff2$|auth).*)",
  ],
};