import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getCurrentUser,
  setSessionCookie,
  setSessionCookieOnResponse,
} from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getDevUserSwitchContext } from "@/lib/canShowDevUserSwitcher";

export const runtime = "nodejs";

/**
 * החלפת משתמש (התחברות כ-) – אדמין או משתמש מנוהל (חזרה לאדמין / למשתמשי אותה קבוצה).
 */
export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const switchCtx = await getDevUserSwitchContext(session);
  if (!switchCtx) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const adminId = switchCtx.adminUserId;
  let canSwitch = false;

  if (isAdminEmail(session.email)) {
    const allowedForAdmin = await prisma.devManagedUser.findFirst({
      where: {
        adminUserId: session.id,
        managedUserId: userId,
      },
      select: { id: true },
    });
    canSwitch = userId === session.id || Boolean(allowedForAdmin);
  } else if (userId === session.id) {
    canSwitch = true;
  } else if (userId === adminId) {
    canSwitch = true;
  } else {
    const allowedSibling = await prisma.devManagedUser.findFirst({
      where: { adminUserId: adminId, managedUserId: userId },
      select: { id: true },
    });
    canSwitch = Boolean(allowedSibling);
  }

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

  const res = NextResponse.json({ success: true, user: authUser });
  setSessionCookieOnResponse(res, token);
  return res;
}
