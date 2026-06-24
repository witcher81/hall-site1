import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (e) {
    // לא חושפים פרטי שגיאה (DSN/סכמה) ללקוח — רק לוג בשרת
    console.error("health/db:", e);
    return NextResponse.json(
      { ok: false, database: "error" },
      { status: 503 }
    );
  }
}
