import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractWebhookSecret(req: NextRequest): string | null {
  const fromHeader = req.headers.get("x-hall-webhook-secret")?.trim();
  if (fromHeader) return fromHeader;
  const auth = req.headers.get("authorization")?.trim();
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

/**
 * Webhook נכנס (שרת → האתר): שירות חיצוני שולח POST עם סוד משותף.
 * אימות: כותרת `X-Hall-Webhook-Secret` או `Authorization: Bearer <סוד>`.
 * כתובת בפרודקשן: `https://<הדומיין שלך>/api/webhooks/inbound`
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.WEBHOOK_INBOUND_SECRET?.trim();
    if (!secret) {
      return NextResponse.json(
        { error: "Webhooks not configured (WEBHOOK_INBOUND_SECRET)" },
        { status: 503 }
      );
    }

    const provided = extractWebhookSecret(req);
    if (!provided || provided !== secret) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      type?: string;
      event?: string;
    };
    const eventType =
      (typeof body.type === "string" && body.type.trim()) ||
      (typeof body.event === "string" && body.event.trim()) ||
      "";

    if (eventType === "ping" || eventType === "health") {
      return NextResponse.json({ ok: true, received: true, processed: true, eventType });
    }

    return NextResponse.json({
      ok: true,
      received: true,
      processed: false,
      eventType: eventType || null,
      message:
        "הבקשה אומתה אך אין מטפל לאירוע מסוג זה. נתמך כרגע: ping, health.",
    });
  } catch (error) {
    console.error("webhooks/inbound POST:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

/** בדיקה שהנתיב קיים (ללא חשיפת סוד) — שימושי אחרי פריסה */
export async function GET() {
  return NextResponse.json({
    ok: true,
    path: "/api/webhooks/inbound",
    method: "POST",
    auth:
      "Header X-Hall-Webhook-Secret or Authorization: Bearer <WEBHOOK_INBOUND_SECRET>",
    supportedEvents: ["ping", "health"],
    note: "אירועים אחרים מתקבלים (200) אך processed:false עד שיוגדר מטפל.",
  });
}
