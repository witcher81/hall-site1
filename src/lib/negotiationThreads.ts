import "server-only";

import { prisma } from "@/lib/prisma";
import {
  contextKeyInquiryService,
  contextKeyInquiryVenue,
  orderedParticipants,
} from "@/lib/conversation-utils";
import { DEFAULT_INQUIRY_SEEKER_MESSAGE } from "@/lib/inquiryMessageDisplay";
import { normalizeInquiryServiceChoices } from "@/lib/venueInquiryAmenities";
import type { NegotiationThreadKind } from "@/lib/negotiationTypes";

export const NEGOTIATION_THREAD_KEY_VENUE = "venue";

export function negotiationThreadKeyForService(serviceId: number): string {
  return `service:${serviceId}`;
}

async function createConversationPair(
  userIdA: number,
  userIdB: number,
  contextKey: string,
  venueId: number | null,
  serviceId: number | null
): Promise<number> {
  const { participant1Id, participant2Id } = orderedParticipants(userIdA, userIdB);

  const existing = await prisma.conversation.findUnique({
    where: {
      participant1Id_participant2Id_contextKey: {
        participant1Id,
        participant2Id,
        contextKey,
      },
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const conv = await prisma.conversation.create({
    data: {
      participant1Id,
      participant2Id,
      contextKey,
      venueId,
      serviceId,
    },
    select: { id: true },
  });
  return conv.id;
}

async function seedOpeningMessage(
  conversationId: number,
  senderId: number,
  body: string | null | undefined
): Promise<void> {
  const text = body?.trim();
  if (!text) return;

  const existing = await prisma.message.findFirst({
    where: { conversationId },
    select: { id: true },
  });
  if (existing) return;

  await prisma.message.create({
    data: {
      conversationId,
      senderId,
      body: text,
    },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

export async function ensureVenueNegotiationThread(input: {
  inquiryId: number;
  seekerUserId: number;
  venueOwnerId: number;
  venueId: number;
  openingMessage?: string | null;
}): Promise<{ threadId: number; conversationId: number }> {
  const threadKey = NEGOTIATION_THREAD_KEY_VENUE;
  const existing = await prisma.negotiationThread.findUnique({
    where: {
      inquiryId_threadKey: {
        inquiryId: input.inquiryId,
        threadKey,
      },
    },
    select: { id: true, conversationId: true },
  });
  if (existing) {
    return { threadId: existing.id, conversationId: existing.conversationId };
  }

  const contextKey = contextKeyInquiryVenue(input.inquiryId);
  const conversationId = await createConversationPair(
    input.seekerUserId,
    input.venueOwnerId,
    contextKey,
    input.venueId,
    null
  );

  const thread = await prisma.negotiationThread.create({
    data: {
      inquiryId: input.inquiryId,
      kind: "VENUE",
      threadKey,
      serviceId: null,
      conversationId,
      status: "OPEN",
    },
    select: { id: true, conversationId: true },
  });

  await seedOpeningMessage(
    conversationId,
    input.seekerUserId,
    input.openingMessage?.trim() || DEFAULT_INQUIRY_SEEKER_MESSAGE
  );

  return { threadId: thread.id, conversationId: thread.conversationId };
}

export async function ensureSupplierNegotiationThread(input: {
  inquiryId: number;
  seekerUserId: number;
  providerId: number;
  venueId: number;
  serviceId: number;
  serviceRequestId: number;
  openingMessage?: string | null;
}): Promise<{ threadId: number; conversationId: number }> {
  const threadKey = negotiationThreadKeyForService(input.serviceId);
  const existing = await prisma.negotiationThread.findUnique({
    where: {
      inquiryId_threadKey: {
        inquiryId: input.inquiryId,
        threadKey,
      },
    },
    select: { id: true, conversationId: true },
  });
  if (existing) {
    if (input.serviceRequestId) {
      await prisma.negotiationThread.updateMany({
        where: { id: existing.id, serviceRequestId: null },
        data: { serviceRequestId: input.serviceRequestId },
      });
    }
    return { threadId: existing.id, conversationId: existing.conversationId };
  }

  const contextKey = contextKeyInquiryService(input.inquiryId, input.serviceId);
  const conversationId = await createConversationPair(
    input.seekerUserId,
    input.providerId,
    contextKey,
    input.venueId,
    input.serviceId
  );

  const thread = await prisma.negotiationThread.create({
    data: {
      inquiryId: input.inquiryId,
      kind: "SUPPLIER",
      threadKey,
      serviceId: input.serviceId,
      serviceRequestId: input.serviceRequestId,
      conversationId,
      status: "OPEN",
    },
    select: { id: true, conversationId: true },
  });

  await seedOpeningMessage(conversationId, input.seekerUserId, input.openingMessage);

  return { threadId: thread.id, conversationId: thread.conversationId };
}

/** יוצר threads חסרים להזמנה קיימת (גם הזמנות ישנות) */
export async function ensureThreadsForInquiry(inquiryId: number): Promise<void> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      venue: { select: { id: true, ownerId: true, name: true } },
    },
  });
  if (!inquiry) return;

  await ensureVenueNegotiationThread({
    inquiryId: inquiry.id,
    seekerUserId: inquiry.userId,
    venueOwnerId: inquiry.venue.ownerId,
    venueId: inquiry.venue.id,
    openingMessage: inquiry.message,
  });

  const serviceRequests = await prisma.serviceRequest.findMany({
    where: { inquiryId: inquiry.id },
    include: {
      service: { select: { id: true, providerId: true, name: true } },
    },
  });

  for (const sr of serviceRequests) {
    await ensureSupplierNegotiationThread({
      inquiryId: inquiry.id,
      seekerUserId: inquiry.userId,
      providerId: sr.service.providerId,
      venueId: inquiry.venue.id,
      serviceId: sr.service.id,
      serviceRequestId: sr.id,
      openingMessage: inquiry.supplierMessage,
    });
  }

  // בקשות ספק ללא inquiryId — ניסיון לקשר לפי שירותים ב-JSON
  if (serviceRequests.length === 0 && inquiry.serviceChoicesJson) {
    let parsedChoices: unknown = null;
    try {
      parsedChoices = JSON.parse(inquiry.serviceChoicesJson);
    } catch {
      parsedChoices = null;
    }
    const linkedIds = collectLinkedMarketplaceServiceIdsFromJson(parsedChoices);
    if (linkedIds.length > 0) {
      const services = await prisma.service.findMany({
        where: { id: { in: linkedIds } },
        select: { id: true, providerId: true },
      });
      for (const svc of services) {
        let sr = await prisma.serviceRequest.findFirst({
          where: {
            userId: inquiry.userId,
            serviceId: svc.id,
            inquiryId: null,
          },
          orderBy: { createdAt: "desc" },
        });
        if (sr) {
          await prisma.serviceRequest.update({
            where: { id: sr.id },
            data: { inquiryId: inquiry.id },
          });
        } else {
          sr = await prisma.serviceRequest.create({
            data: {
              userId: inquiry.userId,
              serviceId: svc.id,
              inquiryId: inquiry.id,
              message: inquiry.supplierMessage?.trim() || inquiry.message,
              eventType: inquiry.eventType,
              preferredDate: inquiry.preferredDate,
            },
          });
        }
        await ensureSupplierNegotiationThread({
          inquiryId: inquiry.id,
          seekerUserId: inquiry.userId,
          providerId: svc.providerId,
          venueId: inquiry.venue.id,
          serviceId: svc.id,
          serviceRequestId: sr.id,
          openingMessage: inquiry.supplierMessage,
        });
      }
    }
  }
}

export async function bootstrapNegotiationForNewInquiry(input: {
  inquiryId: number;
  seekerUserId: number;
  venueOwnerId: number;
  venueId: number;
  venueMessage: string;
  supplierMessage: string | null;
  serviceRequestIds: number[];
}): Promise<void> {
  await ensureVenueNegotiationThread({
    inquiryId: input.inquiryId,
    seekerUserId: input.seekerUserId,
    venueOwnerId: input.venueOwnerId,
    venueId: input.venueId,
    openingMessage: input.venueMessage,
  });

  if (input.serviceRequestIds.length === 0) return;

  const requests = await prisma.serviceRequest.findMany({
    where: { id: { in: input.serviceRequestIds } },
    include: {
      service: { select: { id: true, providerId: true } },
    },
  });

  for (const sr of requests) {
    await ensureSupplierNegotiationThread({
      inquiryId: input.inquiryId,
      seekerUserId: input.seekerUserId,
      providerId: sr.service.providerId,
      venueId: input.venueId,
      serviceId: sr.service.id,
      serviceRequestId: sr.id,
      openingMessage: input.supplierMessage,
    });
  }
}

export function threadKindFromDb(kind: string): NegotiationThreadKind {
  return kind === "SUPPLIER" ? "SUPPLIER" : "VENUE";
}

function parseMarketplaceIdFromChoiceId(id: string): number | null {
  if (!id.startsWith("marketplace:")) return null;
  const n = Number(id.slice("marketplace:".length));
  return Number.isInteger(n) && n > 0 ? n : null;
}

function collectLinkedMarketplaceServiceIdsFromJson(raw: unknown): number[] {
  const ids = new Set<number>();
  if (!Array.isArray(raw)) return [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const sid =
      typeof o.marketplaceServiceId === "number" &&
      Number.isInteger(o.marketplaceServiceId) &&
      o.marketplaceServiceId > 0
        ? o.marketplaceServiceId
        : null;
    if (sid) ids.add(sid);
    const id = typeof o.id === "string" ? parseMarketplaceIdFromChoiceId(o.id) : null;
    if (id) ids.add(id);
  }
  return [...ids];
}
