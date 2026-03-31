import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * רשימת משתמשים – רק בסביבת פיתוח. להסרה לפני פרודקשן.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

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
export async function DELETE(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  // כדי למנוע בעיות קשרי גומלין, מוחקים קודם את כל האולמות ואז את המשתמשים
  const deletedVenues = await prisma.venue.deleteMany({});
  const deletedUsers = await prisma.user.deleteMany({});

  return NextResponse.json({
    ok: true,
    deletedVenues: deletedVenues.count,
    deletedUsers: deletedUsers.count,
  });
}
