import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { allowDevUserSwitchDeployment, isAdminEmail } from "@/lib/admin";
import { getDevUserSwitchContext } from "@/lib/canShowDevUserSwitcher";
import { buildManagedDevUserEmailForAdmin } from "@/lib/devManagedUserEmail";
import {
  validateEmail,
  validateNewPassword,
} from "@/lib/userInputValidation";

export const runtime = "nodejs";

async function requireAdminDevSwitch() {
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
  return null;
}

async function allowedManagedUserIds(adminUserId: number): Promise<number[]> {
  const rows = await prisma.devManagedUser.findMany({
    where: { adminUserId },
    select: { managedUserId: true },
    orderBy: { managedUserId: "asc" },
  });
  return rows.map((r) => r.managedUserId);
}

/**
 * רשימת משתמשים – אדמין או משתמש מנוהל (אותה קבוצה כמו אצל האדמין).
 */
export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ctx = await getDevUserSwitchContext(session);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const managedIds = await allowedManagedUserIds(ctx.adminUserId);
  const allowedIds = [ctx.adminUserId, ...managedIds];

  const users = await prisma.user.findMany({
    where: { id: { in: allowedIds } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return NextResponse.json({
    users,
    canCreateManagedUsers: ctx.canCreateManagedUsers,
  });
}

/**
 * יצירת משתמש "שלי" לאדמין (לשימוש במתג החלפה).
 * המשתמש משויך לאדמין הנוכחי ומופיע רק אצלו ברשימה.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdminDevSwitch();
  if (denied) return denied;
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  const rawEmail =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const useCustomEmail = rawEmail.length > 0;
  if (useCustomEmail) {
    const emailResult = validateEmail(rawEmail);
    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error }, { status: 400 });
    }
  }
  const passResult = validateNewPassword(body.password);
  if (!passResult.ok) {
    return NextResponse.json({ error: passResult.error }, { status: 400 });
  }
  const roleUpper = String(body.role ?? "").toUpperCase();
  if (!["SEEKER", "VENUE_OWNER", "FREELANCER"].includes(roleUpper)) {
    return NextResponse.json({ error: "סוג משתמש לא תקין" }, { status: 400 });
  }

  const passwordHash = await hashPassword(passResult.value);
  const maxAttempts = useCustomEmail ? 1 : 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const emailResult = useCustomEmail
      ? validateEmail(rawEmail)
      : validateEmail(buildManagedDevUserEmailForAdmin(session.email));
    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error }, { status: 400 });
    }

    try {
      const user = await prisma.user.create({
        data: {
          name: (body.name ?? "").trim() || null,
          email: emailResult.value,
          passwordHash,
          role: roleUpper,
          emailVerified: true,
          phone: null,
        },
        select: { id: true, name: true, email: true, role: true },
      });
      await prisma.devManagedUser.create({
        data: {
          adminUserId: session.id,
          managedUserId: user.id,
        },
      });
      return NextResponse.json({ user }, { status: 201 });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        if (useCustomEmail) {
          return NextResponse.json({ error: "האימייל כבר רשום" }, { status: 409 });
        }
        continue;
      }
      console.error("dev users POST:", e);
      return NextResponse.json({ error: "שגיאה ביצירת המשתמש" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "שגיאה ביצירת המשתמש" }, { status: 500 });
}

/**
 * מחיקת כל משתמשי הטסט + האולמות שלהם – רק בסביבת פיתוח.
 * שימושי כשניסית הרבה הרשמות ורוצה להתחיל מאפס.
 */
export async function DELETE(_req: NextRequest) {
  const denied = await requireAdminDevSwitch();
  if (denied) return denied;
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const managedIds = await allowedManagedUserIds(session.id);
  if (managedIds.length === 0) {
    return NextResponse.json({ ok: true, deletedVenues: 0, deletedUsers: 0 });
  }

  // מוחק רק משתמשים ששויכו לאדמין הנוכחי
  const deletedVenues = await prisma.venue.deleteMany({
    where: { ownerId: { in: managedIds } },
  });
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: managedIds } },
  });

  return NextResponse.json({
    ok: true,
    deletedVenues: deletedVenues.count,
    deletedUsers: deletedUsers.count,
  });
}
