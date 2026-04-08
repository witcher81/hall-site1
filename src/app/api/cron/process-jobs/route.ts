import { NextRequest, NextResponse } from "next/server";
import { processPendingJobs } from "@/lib/jobQueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const auth = req.headers.get("authorization")?.trim();
  return auth === `Bearer ${secret}`;
}

/**
 * מעבד משימות מהתור. נקרא ע״י Vercel Cron (GET) — הגדר CRON_SECRET ב־Vercel.
 * @see vercel.json
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processPendingJobs();
  return NextResponse.json({ ok: true, ...result });
}
