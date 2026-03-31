import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

/**
 * החלפת משתמש (התחברות כ-) – רק בסביבת פיתוח. להסרה לפני פרודקשן.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
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

  const authUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  const token = createSessionToken(authUser);
  await setSessionCookie(token);

  return NextResponse.json({ success: true, user: authUser });
}
