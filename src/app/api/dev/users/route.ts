import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  allowDevUserSwitchDeployment,
  isAdminEmail,
} from "@/lib/admin";

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

/**
 * רשימת משתמשים – רק לאדמין (ADMIN_EMAILS).
 */
export async function GET() {
  const denied = await requireAdminDevSwitch();
  if (denied) return denied;

  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return NextResponse.json({ users });
}

/**
 * מחיקת כל משתמשי הטסט + האולמות שלהם – רק בסביבת פיתוח.
 * שימושי כשניסית הרבה הרשמות ורוצה להתחיל מאפס.
 */
export async function DELETE(_req: NextRequest) {
  const denied = await requireAdminDevSwitch();
  if (denied) return denied;

  // כדי למנוע בעיות קשרי גומלין, מוחקים קודם את כל האולמות ואז את המשתמשים
  const deletedVenues = await prisma.venue.deleteMany({});
  const deletedUsers = await prisma.user.deleteMany({});

  return NextResponse.json({
    ok: true,
    deletedVenues: deletedVenues.count,
    deletedUsers: deletedUsers.count,
  });
}
