import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertThreadAccess, assertThreadOpenForNegotiation } from "@/lib/negotiationAuth";
import { parseNegotiationOfferAmounts } from "@/lib/negotiationFormat";
import { notifyNewOffer } from "@/lib/negotiationOfferActions";
import {
  assertCanCreateExactQuote,
  loadThreadCatalogBounds,
} from "@/lib/negotiationPricingRules";
import { prisma } from "@/lib/prisma";
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
  const open = assertThreadOpenForNegotiation(access.thread);
  if (!open.ok) {
    return NextResponse.json({ error: open.error }, { status: open.status });
  }

  const loaded = await loadThreadCatalogBounds(threadId);
  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const amounts = parseNegotiationOfferAmounts(body);
  if (!amounts.ok) return badRequest(amounts.error);

  const quoteGate = assertCanCreateExactQuote({
    role: access.role,
    catalog: loaded.catalog,
    threadStatus: loaded.thread.status,
    seekerReQuoteRequestedAt: loaded.thread.seekerReQuoteRequestedAt,
    offers: loaded.offers,
    amountMinNis: amounts.amountMinNis,
    amountMaxNis: amounts.amountMaxNis,
  });
  if (!quoteGate.ok) return badRequest(quoteGate.error);

  const msgRes = validateOptionalLongText(
    body.message,
    USER_INPUT_MAX.INQUIRY_MESSAGE,
    "הערה להצעה"
  );
  if (!msgRes.ok) return badRequest(msgRes.error);

  const offer = await prisma.negotiationOffer.create({
    data: {
      threadId,
      authorUserId: user.id,
      authorRole: access.role,
      amountMinNis: quoteGate.exactAmount,
      amountMaxNis: quoteGate.exactAmount,
      message: msgRes.value,
      respondsToOfferId: null,
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
