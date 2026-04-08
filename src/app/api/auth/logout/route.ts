import { NextResponse } from "next/server";
import { clearPendingVerificationCookie, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();
  await clearPendingVerificationCookie();
  return NextResponse.json({ success: true }, { status: 200 });
}
