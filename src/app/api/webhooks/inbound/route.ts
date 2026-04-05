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

  await req.json().catch(() => ({}));

  return NextResponse.json({ ok: true });
}

/** בדיקה שהנתיב קיים (ללא חשיפת סוד) — שימושי אחרי פריסה */
export async function GET() {
  return NextResponse.json({
    ok: true,
    path: "/api/webhooks/inbound",
    method: "POST",
    auth:
      "Header X-Hall-Webhook-Secret or Authorization: Bearer <WEBHOOK_INBOUND_SECRET>",
  });
}
