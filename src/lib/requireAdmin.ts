import "server-only";

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export async function requireAdminApi() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    return {
      user: null,
      denied: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user, denied: null };
}
