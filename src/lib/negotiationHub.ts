import "server-only";

import { prisma } from "@/lib/prisma";
import { ensureThreadsForInquiry, threadKindFromDb } from "@/lib/negotiationThreads";
import type {
  NegotiationAuthorRole,
  NegotiationHubView,
  NegotiationOfferStatus,
  NegotiationThreadStatus,
  NegotiationTimelineItem,
} from "@/lib/negotiationTypes";

function mapOfferStatus(raw: string): NegotiationOfferStatus {
  const s = raw.toUpperCase();
  if (
    s === "ACCEPTED" ||
    s === "REJECTED" ||
    s === "WITHDRAWN" ||
    s === "SUPERSEDED"
  ) {
    return s;
  }
  return "PENDING";
}

function mapThreadStatus(raw: string): NegotiationThreadStatus {
  if (raw === "DEAL_ACCEPTED" || raw === "CLOSED") return raw;
  return "OPEN";
}

export async function buildNegotiationHub(
  inquiryId: number,
  currentUserId: number,
  currentUserRole: NegotiationAuthorRole,
  options?: { threadFilter?: "VENUE" | "SUPPLIER" | "ALL" }
): Promise<NegotiationHubView> {
  await ensureThreadsForInquiry(inquiryId);

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      venue: { select: { name: true } },
    },
  });
  if (!inquiry) {
    return { inquiryId, threads: [], currentUserId, currentUserRole };
  }

  const threads = await prisma.negotiationThread.findMany({
    where: {
      inquiryId,
      ...(options?.threadFilter === "VENUE"
        ? { kind: "VENUE" }
        : options?.threadFilter === "SUPPLIER"
          ? { kind: "SUPPLIER" }
          : {}),
      ...(currentUserRole === "FREELANCER"
        ? { kind: "SUPPLIER", service: { providerId: currentUserId } }
        : currentUserRole === "VENUE_OWNER"
          ? { kind: "VENUE" }
          : {}),
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          provider: { select: { businessName: true, name: true } },
        },
      },
      conversation: {
        select: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              body: true,
              senderId: true,
              createdAt: true,
            },
          },
        },
      },
      offers: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          authorUserId: true,
          authorRole: true,
          amountMinNis: true,
          amountMaxNis: true,
          message: true,
          status: true,
          respondsToOfferId: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ kind: "asc" }, { id: "asc" }],
  });

  const threadViews = threads.map((t) => {
    const kind = threadKindFromDb(t.kind);
    const label =
      kind === "VENUE"
        ? inquiry.venue.name
        : t.service?.name?.trim() || "ספק במאגר";
    const sublabel =
      kind === "SUPPLIER"
        ? t.service?.provider.businessName?.trim() ||
          t.service?.provider.name?.trim() ||
          null
        : "בעל האולם";

    const messageItems: NegotiationTimelineItem[] = t.conversation.messages.map(
      (m) => ({
        type: "message" as const,
        id: m.id,
        senderId: m.senderId,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })
    );

    const offerItems: NegotiationTimelineItem[] = t.offers.map((o) => ({
      type: "offer" as const,
      id: o.id,
      authorUserId: o.authorUserId,
      authorRole: o.authorRole as NegotiationAuthorRole,
      amountMinNis: o.amountMinNis,
      amountMaxNis: o.amountMaxNis,
      message: o.message,
      status: mapOfferStatus(o.status),
      respondsToOfferId: o.respondsToOfferId,
      createdAt: o.createdAt.toISOString(),
    }));

    const timeline = [...messageItems, ...offerItems].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const accepted = t.offers.find((o) => o.status === "ACCEPTED");

    return {
      id: t.id,
      kind,
      threadKey: t.threadKey,
      status: mapThreadStatus(t.status),
      serviceId: t.serviceId,
      serviceRequestId: t.serviceRequestId,
      conversationId: t.conversationId,
      label,
      sublabel,
      timeline,
      acceptedOffer: accepted
        ? {
            id: accepted.id,
            amountMinNis: accepted.amountMinNis,
            amountMaxNis: accepted.amountMaxNis,
            message: accepted.message,
          }
        : null,
    };
  });

  return {
    inquiryId,
    threads: threadViews,
    currentUserId,
    currentUserRole,
  };
}
