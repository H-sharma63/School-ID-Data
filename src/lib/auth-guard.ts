import { auth } from "@/lib/auth";

export async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  if (role !== "ADMIN") {
    return { error: "Forbidden: Admin access required", status: 403 };
  }

  return { session };
}

export async function requireAuth() {
  const session = await auth();

  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  return { session };
}