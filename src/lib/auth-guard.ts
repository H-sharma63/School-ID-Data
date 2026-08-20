import { auth } from "@/lib/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  return { session };
}