import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminEmail } from "@/lib/admin";
import {
  clearSessionCookiesOnResponse,
  getCurrentUser,
  verifyPassword,
} from "@/lib/auth";
import { deleteUserAccount } from "@/lib/deleteUserAccount";
import { prisma } from "@/lib/prisma";
import { validateLoginPassword } from "@/lib/userInputValidation";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAdminEmail(user.email)) {
    return NextResponse.json(
      {
        error:
          "חשבון אדמין לא ניתן למחיקה דרך האתר. פנו לתמיכה או הסירו את האימייל מ-ADMIN_EMAILS לפני מחיקה ידנית.",
      },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const passwordResult = validateLoginPassword(body.password);
  if (!passwordResult.ok) {
    return NextResponse.json({ error: "חובה להזין סיסמה לאימות" }, { status: 400 });
  }

  const confirmEmail =
    typeof body.confirmEmail === "string" ? body.confirmEmail.trim() : "";
  if (!confirmEmail || confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "יש להקליד את כתובת האימייל של החשבון בדיוק כפי שמופיעה למעלה" },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await verifyPassword(passwordResult.value, dbUser.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "הסיסמה שגויה" }, { status: 401 });
  }

  try {
    await deleteUserAccount(user.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "לא ניתן למחוק את החשבון כרגע — עדיין יש נתונים מקושרים. נסו שוב או פנו לתמיכה.",
        },
        { status: 409 }
      );
    }
    throw e;
  }

  const res = NextResponse.json({ ok: true });
  clearSessionCookiesOnResponse(res);
  return res;
}
