import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { secretsEqual } from "@/lib/timingSafeSecret";
import { applyListingModerationDecision } from "@/lib/listingModerationService";
import { ListingModerationSource } from "@/lib/listingModerationTypes";

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
 * Webhook לאישור/דחיית תוכן אוטומטי (AI / מערכת חיצונית).
 * אימות: `X-Hall-Webhook-Secret` או `Authorization: Bearer <WEBHOOK_INBOUND_SECRET>`.
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
    if (!secretsEqual(provided, secret)) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const listingType = body.listingType;
    const listingId = Number(body.listingId);
    const decision = body.decision;
    const note = typeof body.note === "string" ? body.note : null;
    const metadata =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : undefined;

    if (listingType !== "VENUE" && listingType !== "SERVICE") {
      return NextResponse.json({ error: "listingType לא תקין" }, { status: 400 });
    }
    if (!Number.isInteger(listingId) || listingId <= 0) {
      return NextResponse.json({ error: "listingId לא תקין" }, { status: 400 });
    }
    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return NextResponse.json({ error: "decision לא תקין" }, { status: 400 });
    }

    const result = await applyListingModerationDecision({
      listingType,
      listingId,
      decision,
      note,
      source: ListingModerationSource.API,
      metadata,
      actorUserId: null,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, processed: true });
  } catch (error) {
    console.error("webhooks/listing-moderation POST:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
