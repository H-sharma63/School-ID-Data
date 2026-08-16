import { auth } from "@/lib/auth";

export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};