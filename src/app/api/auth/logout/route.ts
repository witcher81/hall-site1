import { NextResponse } from "next/server";
import {
  clearPendingVerificationCookie,
  clearSessionCookie,
  clearSessionCookiesOnResponse,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await clearSessionCookie();
  await clearPendingVerificationCookie();

  const res = NextResponse.json({ success: true }, { status: 200 });
  clearSessionCookiesOnResponse(res);
  return res;
}
