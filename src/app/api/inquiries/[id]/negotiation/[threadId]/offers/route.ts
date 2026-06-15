import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assertThreadAccess } from "@/lib/negotiationAuth";
import { parseNegotiationOfferAmounts } from "@/lib/negotiationFormat";
import { notifyNewOffer } from "@/lib/negotiationOfferActions";
import {
  USER_INPUT_MAX,
  badRequest,
  validateOptionalLongText,
} from "@/lib/userInputValidation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; threadId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, threadId: threadIdRaw } = await context.params;
  const inquiryId = Number(id);
  const threadId = Number(threadIdRaw);
  if (
    !Number.isInteger(inquiryId) ||
    inquiryId <= 0 ||
    !Number.isInteger(threadId) ||
    threadId <= 0
  ) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const access = await assertThreadAccess(threadId, user);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if (access.thread.inquiryId !== inquiryId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (access.thread.status === "DEAL_ACCEPTED") {
    return badRequest("כבר אושרה הצעה בשרשור זה");
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const amounts = parseNegotiationOfferAmounts(body);
  if (!amounts.ok) return badRequest(amounts.error);

  const msgRes = validateOptionalLongText(
    body.message,
    USER_INPUT_MAX.INQUIRY_MESSAGE,
    "הערה להצעה"
  );
  if (!msgRes.ok) return badRequest(msgRes.error);

  const respondsToOfferId =
    body.respondsToOfferId != null ? Number(body.respondsToOfferId) : null;
  if (
    respondsToOfferId != null &&
    (!Number.isInteger(respondsToOfferId) || respondsToOfferId <= 0)
  ) {
    return badRequest("הצעה לתגובה לא תקינה");
  }

  const offer = await prisma.negotiationOffer.create({
    data: {
      threadId,
      authorUserId: user.id,
      authorRole: access.role,
      amountMinNis: amounts.amountMinNis,
      amountMaxNis: amounts.amountMaxNis,
      message: msgRes.value,
      respondsToOfferId:
        respondsToOfferId && Number.isInteger(respondsToOfferId)
          ? respondsToOfferId
          : null,
      status: "PENDING",
    },
  });

  await notifyNewOffer({
    threadId,
    inquiryId,
    actorUserId: user.id,
    actorName: user.name,
  });

  return NextResponse.json({
    offer: {
      type: "offer",
      id: offer.id,
      authorUserId: offer.authorUserId,
      authorRole: offer.authorRole,
      amountMinNis: offer.amountMinNis,
      amountMaxNis: offer.amountMaxNis,
      message: offer.message,
      status: offer.status,
      respondsToOfferId: offer.respondsToOfferId,
      createdAt: offer.createdAt.toISOString(),
    },
  });
}
