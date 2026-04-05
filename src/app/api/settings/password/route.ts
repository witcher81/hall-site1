import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { validateLoginPassword, validateNewPassword } from "@/lib/userInputValidation";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const curResult = validateLoginPassword(body.currentPassword);
  if (!curResult.ok) {
    return NextResponse.json({ error: "חובה למלא סיסמה נוכחית וחדשה" }, { status: 400 });
  }
  const currentPassword = curResult.value;

  const newResult = validateNewPassword(body.newPassword);
  if (!newResult.ok) {
    return NextResponse.json({ error: newResult.error }, { status: 400 });
  }
  const newPassword = newResult.value;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "הסיסמה הנוכחית שגויה" },
      { status: 401 }
    );
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ ok: true });
}

