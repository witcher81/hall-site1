import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { applyListingModerationDecision } from "@/lib/listingModerationService";
import {
  ListingModerationStatus,
  LISTING_TYPE_LABELS,
  type ListingType,
} from "@/lib/listingModerationTypes";

export const runtime = "nodejs";

function parseListingType(raw: string | null): ListingType | null {
  if (raw === "VENUE" || raw === "SERVICE") return raw;
  return null;
}

export async function GET(req: NextRequest) {
  const { denied, user } = await requireAdminApi();
  if (denied) return denied;

  const status =
    req.nextUrl.searchParams.get("status")?.trim() || ListingModerationStatus.PENDING;
  const typeFilter = parseListingType(req.nextUrl.searchParams.get("type"));

  const venueWhere =
    status === "ALL" ? {} : { moderationStatus: status };
  const serviceWhere =
    status === "ALL" ? {} : { moderationStatus: status };

  const [venues, services, pendingVenueCount, pendingServiceCount] = await Promise.all([
    typeFilter === "SERVICE"
      ? []
      : prisma.venue.findMany({
          where: venueWhere,
          orderBy: { submittedForReviewAt: "desc" },
          take: 100,
          select: {
            id: true,
            name: true,
            city: true,
            moderationStatus: true,
            moderationNote: true,
            submittedForReviewAt: true,
            contentRevision: true,
            coverImageUrl: true,
            owner: { select: { id: true, email: true, name: true, businessName: true } },
          },
        }),
    typeFilter === "VENUE"
      ? []
      : prisma.service.findMany({
          where: serviceWhere,
          orderBy: { submittedForReviewAt: "desc" },
          take: 100,
          select: {
            id: true,
            name: true,
            category: true,
            moderationStatus: true,
            moderationNote: true,
            submittedForReviewAt: true,
            contentRevision: true,
            coverImageUrl: true,
            provider: {
              select: { id: true, email: true, name: true, businessName: true },
            },
          },
        }),
    prisma.venue.count({ where: { moderationStatus: ListingModerationStatus.PENDING } }),
    prisma.service.count({ where: { moderationStatus: ListingModerationStatus.PENDING } }),
  ]);

  return NextResponse.json({
    venues: venues.map((v) => ({
      listingType: "VENUE" as const,
      listingTypeLabel: LISTING_TYPE_LABELS.VENUE,
      id: v.id,
      name: v.name,
      subtitle: v.city,
      moderationStatus: v.moderationStatus,
      moderationNote: v.moderationNote,
      submittedForReviewAt: v.submittedForReviewAt.toISOString(),
      contentRevision: v.contentRevision,
      coverImageUrl: v.coverImageUrl,
      owner: v.owner,
      publicHref: `/halls/${v.id}`,
      editHref: `/dashboard/venue-owner/venues/${v.id}/edit`,
    })),
    services: services.map((s) => ({
      listingType: "SERVICE" as const,
      listingTypeLabel: LISTING_TYPE_LABELS.SERVICE,
      id: s.id,
      name: s.name,
      subtitle: s.category,
      moderationStatus: s.moderationStatus,
      moderationNote: s.moderationNote,
      submittedForReviewAt: s.submittedForReviewAt.toISOString(),
      contentRevision: s.contentRevision,
      coverImageUrl: s.coverImageUrl,
      owner: s.provider,
      publicHref: `/services/${s.id}`,
      editHref: `/dashboard/freelancer/services/${s.id}/edit`,
    })),
    pendingCounts: {
      venues: pendingVenueCount,
      services: pendingServiceCount,
      total: pendingVenueCount + pendingServiceCount,
    },
    adminUserId: user?.id ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const { denied, user } = await requireAdminApi();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const listingType = parseListingType(
    typeof body.listingType === "string" ? body.listingType.trim() : null
  );
  const listingId = Number(body.listingId);
  const decision =
    typeof body.decision === "string" ? body.decision.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : null;

  if (!listingType || !Number.isInteger(listingId) || listingId <= 0) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return NextResponse.json({ error: "החלטה לא תקינה" }, { status: 400 });
  }

  const result = await applyListingModerationDecision({
    listingType,
    listingId,
    decision,
    note,
    actorUserId: user?.id ?? null,
    source: "ADMIN",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
