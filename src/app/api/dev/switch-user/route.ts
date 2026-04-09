import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getCurrentUser,
  setSessionCookie,
} from "@/lib/auth";
import { allowDevUserSwitchDeployment, isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";

/**
 * החלפת משתמש (התחברות כ-) – רק לאדמין (ADMIN_EMAILS).
 */
export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!allowDevUserSwitchDeployment()) {
    return NextResponse.json(
      { error: "Dev user switch disabled in production" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const userId = Number(body?.userId ?? body?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const allowedForAdmin = await prisma.devManagedUser.findFirst({
    where: {
      adminUserId: session.id,
      managedUserId: userId,
    },
    select: { id: true },
  });
  const canSwitch = userId === session.id || Boolean(allowedForAdmin);
  if (!canSwitch) {
    return NextResponse.json(
      { error: "ניתן לעבור רק למשתמשים שיצרת" },
      { status: 403 }
    );
  }

  const authUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
  };
  const token = createSessionToken(authUser);
  await setSessionCookie(token);

  return NextResponse.json({ success: true, user: authUser });
}
