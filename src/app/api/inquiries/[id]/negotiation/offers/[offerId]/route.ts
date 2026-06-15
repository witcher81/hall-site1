import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assertOfferAccess } from "@/lib/negotiationAuth";
import {
  acceptNegotiationOffer,
  rejectNegotiationOffer,
} from "@/lib/negotiationOfferActions";
import { parseNegotiationOfferAmounts } from "@/lib/negotiationFormat";
import { notifyNewOffer } from "@/lib/negotiationOfferActions";
import {
  USER_INPUT_MAX,
  badRequest,
  validateOptionalLongText,
} from "@/lib/userInputValidation";

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

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action =
    typeof body.action === "string" ? body.action.trim().toLowerCase() : "";

  if (action === "accept") {
    const result = await acceptNegotiationOffer({
      offerId,
      actorUserId: user.id,
      actorRole: access.role,
    });
    if (!result.ok) return badRequest(result.error);
    return NextResponse.json({ ok: true, status: "ACCEPTED" });
  }

  if (action === "reject") {
    const result = await rejectNegotiationOffer({
      offerId,
      actorUserId: user.id,
    });
    if (!result.ok) return badRequest(result.error);
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  if (action === "counter") {
    const amounts = parseNegotiationOfferAmounts(body);
    if (!amounts.ok) return badRequest(amounts.error);

    const msgRes = validateOptionalLongText(
      body.message,
      USER_INPUT_MAX.INQUIRY_MESSAGE,
      "הערה להצעה"
    );
    if (!msgRes.ok) return badRequest(msgRes.error);

    await prisma.negotiationOffer.update({
      where: { id: offerId },
      data: { status: "SUPERSEDED" },
    });

    const counter = await prisma.negotiationOffer.create({
      data: {
        threadId: access.thread.id,
        authorUserId: user.id,
        authorRole: access.role,
        amountMinNis: amounts.amountMinNis,
        amountMaxNis: amounts.amountMaxNis,
        message: msgRes.value,
        respondsToOfferId: offerId,
        status: "PENDING",
      },
    });

    await notifyNewOffer({
      threadId: access.thread.id,
      inquiryId,
      actorUserId: user.id,
      actorName: user.name,
    });

    return NextResponse.json({
      ok: true,
      offer: {
        type: "offer",
        id: counter.id,
        authorUserId: counter.authorUserId,
        authorRole: counter.authorRole,
        amountMinNis: counter.amountMinNis,
        amountMaxNis: counter.amountMaxNis,
        message: counter.message,
        status: counter.status,
        respondsToOfferId: counter.respondsToOfferId,
        createdAt: counter.createdAt.toISOString(),
      },
    });
  }

  return badRequest("פעולה לא נתמכת");
}
