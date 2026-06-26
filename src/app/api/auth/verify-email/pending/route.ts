import { NextResponse } from "next/server";

import { getPendingVerificationUser } from "@/lib/auth";

export const runtime = "nodejs";

/** מצב המתנה לאימות — לדף הזנת קוד (לא סשן מלא) */
export async function GET() {
  const pending = await getPendingVerificationUser();
  if (!pending) {
    return NextResponse.json({ pending: false }, { status: 401 });
  }
  return NextResponse.json({
    pending: true,
    email: pending.email,
  });
}
