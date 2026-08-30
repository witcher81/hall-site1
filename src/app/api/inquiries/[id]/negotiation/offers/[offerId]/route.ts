import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertOfferAccess, assertThreadOpenForNegotiation } from "@/lib/negotiationAuth";
import {
  acceptNegotiationOffer,
  rejectNegotiationOffer,
} from "@/lib/negotiationOfferActions";
import { badRequest } from "@/lib/userInputValidation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; offerId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, offerId: offerIdRaw } = await context.params;
  const inquiryId = Number(id);
  const offerId = Number(offerIdRaw);
  if (
    !Number.isInteger(inquiryId) ||
    inquiryId <= 0 ||
    !Number.isInteger(offerId) ||
    offerId <= 0
  ) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const access = await assertOfferAccess(offerId, user);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if (access.thread.inquiryId !== inquiryId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const open = assertThreadOpenForNegotiation(access.thread);
  if (!open.ok) {
    return NextResponse.json({ error: open.error }, { status: open.status });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action =
    typeof body.action === "string" ? body.action.trim().toLowerCase() : "";

  if (action === "accept") {
    if (access.role !== "SEEKER") {
      return badRequest("רק המבקש יכול לאשר ציטוט מחיר");
    }
    const result = await acceptNegotiationOffer({
      offerId,
      actorUserId: user.id,
      actorRole: access.role,
    });
    if (!result.ok) return badRequest(result.error);
    return NextResponse.json({ ok: true, status: "ACCEPTED" });
  }

  if (action === "reject") {
    if (access.role !== "SEEKER") {
      return badRequest("רק המבקש יכול לדחות ציטוט מחיר");
    }
    const result = await rejectNegotiationOffer({
      offerId,
      actorUserId: user.id,
    });
    if (!result.ok) return badRequest(result.error);
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  if (action === "counter") {
    return badRequest(
      "הצעות נגדיות אינן זמינות — הספק שולח מחיר מדויק; ניתן לבקש ציטוט מחדש פעם אחת"
    );
  }

  return badRequest("פעולה לא נתמכת");
}
