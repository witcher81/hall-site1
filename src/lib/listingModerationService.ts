import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { publishMessage } from "@/lib/messagingQueue";
import {
  ListingModerationSource,
  ListingModerationStatus,
  type ExternalModerationDecisionPayload,
  type ListingModerationStatusValue,
  type ListingType,
} from "@/lib/listingModerationTypes";

export type ListingModerationActor = {
  userId?: number | null;
  source?: string;
};

export function moderationFieldsForNewListing(): Pick<
  Prisma.VenueCreateInput,
  | "moderationStatus"
  | "submittedForReviewAt"
  | "contentRevision"
  | "moderationNote"
  | "moderatedAt"
  | "moderatedByUserId"
> {
  return {
    moderationStatus: ListingModerationStatus.PENDING,
    submittedForReviewAt: new Date(),
    contentRevision: 1,
    moderationNote: null,
    moderatedAt: null,
    moderatedByUserId: null,
  };
}

export function moderationFieldsForOwnerEdit(
  current: {
    moderationStatus: string;
    contentRevision: number;
  }
): Pick<
  Prisma.VenueUpdateInput,
  | "moderationStatus"
  | "submittedForReviewAt"
  | "contentRevision"
  | "moderationNote"
  | "moderatedAt"
  | "moderatedByUserId"
> {
  const wasLive =
    current.moderationStatus === ListingModerationStatus.APPROVED ||
    current.moderationStatus === ListingModerationStatus.REJECTED;
  return {
    moderationStatus: ListingModerationStatus.PENDING,
    submittedForReviewAt: new Date(),
    contentRevision: wasLive ? current.contentRevision + 1 : current.contentRevision,
    moderationNote: null,
    moderatedAt: null,
    moderatedByUserId: null,
  };
}

async function recordModerationEvent(input: {
  listingType: ListingType;
  listingId: number;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  note?: string | null;
  actorUserId?: number | null;
  source?: string;
  metadata?: Record<string, unknown>;
}) {
  const metadataJson =
    input.metadata && Object.keys(input.metadata).length > 0
      ? JSON.stringify(input.metadata)
      : null;

  await prisma.listingModerationEvent.create({
    data: {
      listingType: input.listingType,
      listingId: input.listingId,
      action: input.action,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      note: input.note?.trim() || null,
      actorUserId: input.actorUserId ?? null,
      source: input.source ?? ListingModerationSource.ADMIN,
      metadataJson,
    },
  });
}

async function notifyOwnerOnDecision(input: {
  ownerUserId: number;
  listingType: ListingType;
  listingId: number;
  listingName: string;
  status: ListingModerationStatusValue;
  note?: string | null;
}) {
  if (input.status === ListingModerationStatus.APPROVED) {
    await createNotification({
      userId: input.ownerUserId,
      type:
        input.listingType === "VENUE"
          ? "LISTING_VENUE_APPROVED"
          : "LISTING_SERVICE_APPROVED",
      title:
        input.listingType === "VENUE" ? "האולם אושר לפרסום" : "השירות אושר לפרסום",
      body: `«${input.listingName}» פורסם באתר ומופיע לחיפוש.`,
      href:
        input.listingType === "VENUE"
          ? `/halls/${input.listingId}`
          : `/services/${input.listingId}`,
    });
    return;
  }

  if (input.status === ListingModerationStatus.REJECTED) {
    const reason = input.note?.trim()
      ? ` סיבה: ${input.note.trim()}`
      : " ערכו לפי ההערות ושלחו שוב לבדיקה.";
    await createNotification({
      userId: input.ownerUserId,
      type:
        input.listingType === "VENUE"
          ? "LISTING_VENUE_REJECTED"
          : "LISTING_SERVICE_REJECTED",
      title:
        input.listingType === "VENUE"
          ? "האולם לא אושר לפרסום"
          : "השירות לא אושר לפרסום",
      body: `«${input.listingName}» דורש תיקון.${reason}`,
      href:
        input.listingType === "VENUE"
          ? `/dashboard/venue-owner/venues/${input.listingId}/edit`
          : `/dashboard/freelancer/services/${input.listingId}/edit`,
    });
  }
}

async function queueModerationSideEffects(input: {
  listingType: ListingType;
  listingId: number;
  status: ListingModerationStatusValue;
  listingName: string;
  city?: string | null;
}) {
  try {
    await publishMessage("listing.moderation.decision", {
      listingType: input.listingType,
      listingId: input.listingId,
      status: input.status,
      listingName: input.listingName,
      city: input.city ?? null,
    });
  } catch (e) {
    console.error("listing.moderation.decision queue publish failed", e);
  }

  if (
    input.listingType === "VENUE" &&
    input.status === ListingModerationStatus.APPROVED &&
    input.city
  ) {
    const seekers = await prisma.user.findMany({
      where: {
        role: "SEEKER",
        OR: [
          { favorites: { some: { venue: { city: input.city } } } },
          { inquiriesSent: { some: { venue: { city: input.city } } } },
        ],
      },
      select: { id: true },
    });
    await Promise.all(
      seekers.map((s) =>
        createNotification({
          userId: s.id,
          type: "NEW_VENUE_IN_CITY",
          title: "אולם חדש בעיר שלך",
          body: `נוסף אולם חדש בעיר ${input.city}: "${input.listingName}".`,
          href: "/halls",
        })
      )
    );
  }
}

export async function applyListingModerationDecision(
  input: ExternalModerationDecisionPayload & ListingModerationActor
): Promise<{ ok: true } | { ok: false; error: string }> {
  const decision = input.decision;
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return { ok: false, error: "החלטה לא תקינה" };
  }
  if (decision === "REJECTED" && !input.note?.trim()) {
    return { ok: false, error: "נא לציין סיבת דחייה" };
  }

  const source = input.source ?? ListingModerationSource.ADMIN;

  if (input.listingType === "VENUE") {
    const venue = await prisma.venue.findUnique({
      where: { id: input.listingId },
      select: {
        id: true,
        name: true,
        city: true,
        ownerId: true,
        moderationStatus: true,
      },
    });
    if (!venue) return { ok: false, error: "אולם לא נמצא" };

    const fromStatus = venue.moderationStatus;
    await prisma.venue.update({
      where: { id: venue.id },
      data: {
        moderationStatus: decision,
        moderationNote: decision === "REJECTED" ? input.note?.trim() || null : null,
        moderatedAt: new Date(),
        moderatedByUserId: input.actorUserId ?? null,
      },
    });

    await recordModerationEvent({
      listingType: "VENUE",
      listingId: venue.id,
      action: decision,
      fromStatus,
      toStatus: decision,
      note: input.note,
      actorUserId: input.actorUserId,
      source,
      metadata: input.metadata,
    });

    await notifyOwnerOnDecision({
      ownerUserId: venue.ownerId,
      listingType: "VENUE",
      listingId: venue.id,
      listingName: venue.name,
      status: decision,
      note: input.note,
    });

    if (decision === ListingModerationStatus.APPROVED) {
      await queueModerationSideEffects({
        listingType: "VENUE",
        listingId: venue.id,
        status: decision,
        listingName: venue.name,
        city: venue.city,
      });
    }

    return { ok: true };
  }

  const service = await prisma.service.findUnique({
    where: { id: input.listingId },
    select: {
      id: true,
      name: true,
      providerId: true,
      moderationStatus: true,
    },
  });
  if (!service) return { ok: false, error: "שירות לא נמצא" };

  const fromStatus = service.moderationStatus;
  await prisma.service.update({
    where: { id: service.id },
    data: {
      moderationStatus: decision,
      moderationNote: decision === "REJECTED" ? input.note?.trim() || null : null,
      moderatedAt: new Date(),
      moderatedByUserId: input.actorUserId ?? null,
    },
  });

  await recordModerationEvent({
    listingType: "SERVICE",
    listingId: service.id,
    action: decision,
    fromStatus,
    toStatus: decision,
    note: input.note,
    actorUserId: input.actorUserId,
    source,
    metadata: input.metadata,
  });

  await notifyOwnerOnDecision({
    ownerUserId: service.providerId,
    listingType: "SERVICE",
    listingId: service.id,
    listingName: service.name,
    status: decision,
    note: input.note,
  });

  if (decision === ListingModerationStatus.APPROVED) {
    await queueModerationSideEffects({
      listingType: "SERVICE",
      listingId: service.id,
      status: decision,
      listingName: service.name,
    });
  }

  return { ok: true };
}

export async function logListingSubmittedForReview(input: {
  listingType: ListingType;
  listingId: number;
  fromStatus: string | null;
  actorUserId?: number | null;
  source?: string;
}) {
  await recordModerationEvent({
    listingType: input.listingType,
    listingId: input.listingId,
    action:
      input.fromStatus === ListingModerationStatus.APPROVED ||
      input.fromStatus === ListingModerationStatus.REJECTED
        ? "RESUBMITTED"
        : "SUBMITTED",
    fromStatus: input.fromStatus,
    toStatus: ListingModerationStatus.PENDING,
    actorUserId: input.actorUserId,
    source: input.source ?? ListingModerationSource.OWNER,
  });
}

export function canViewListingDetail(input: {
  moderationStatus: string;
  ownerUserId: number;
  viewerUserId: number | null;
  viewerEmail: string | null;
  isAdmin: boolean;
}): boolean {
  if (input.moderationStatus === ListingModerationStatus.APPROVED) return true;
  if (input.isAdmin) return true;
  if (input.viewerUserId != null && input.viewerUserId === input.ownerUserId) {
    return true;
  }
  return false;
}
