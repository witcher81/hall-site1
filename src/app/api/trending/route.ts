import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  MAX_POPULAR_BADGES,
  MIN_WEEKLY_ENGAGED_VIEWS_FOR_BADGE,
} from "@/lib/popularityConfig";

export const runtime = "nodejs";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function toNum(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return v;
  return Number(v);
}

/**
 * מזהים "פופולריים" לתגיות ברשימות חיפוש.
 * נספרות רק צפיות מעורבות (dwell) + סף מינימלי בשבוע — ראה popularityConfig.
 */
export async function GET() {
  const since = new Date(Date.now() - WEEK_MS);

  try {
    const venueRows = await prisma.$queryRaw<{ venueId: number; cnt: unknown }[]>(
      Prisma.sql`
        SELECT "venueId" as venueId, COUNT(*) as cnt
        FROM "VenuePageView"
        WHERE "createdAt" >= ${since}
        GROUP BY "venueId"
        ORDER BY cnt DESC
        LIMIT ${MAX_POPULAR_BADGES * 2}
      `
    );

    const providerRows = await prisma.$queryRaw<{ providerUserId: number; cnt: unknown }[]>(
      Prisma.sql`
        SELECT "providerUserId" as providerUserId, COUNT(*) as cnt
        FROM "FreelancerProfileView"
        WHERE "createdAt" >= ${since}
        GROUP BY "providerUserId"
        ORDER BY cnt DESC
        LIMIT ${MAX_POPULAR_BADGES * 2}
      `
    );

    const popularVenueIds = venueRows
      .filter((r) => toNum(r.cnt) >= MIN_WEEKLY_ENGAGED_VIEWS_FOR_BADGE)
      .slice(0, MAX_POPULAR_BADGES)
      .map((r) => r.venueId);

    const popularProviderIds = providerRows
      .filter((r) => toNum(r.cnt) >= MIN_WEEKLY_ENGAGED_VIEWS_FOR_BADGE)
      .slice(0, MAX_POPULAR_BADGES)
      .map((r) => r.providerUserId);

    return NextResponse.json({
      popularVenueIds,
      popularProviderIds,
    });
  } catch (e) {
    console.error("trending GET:", e);
    return NextResponse.json(
      { error: "Failed to load popular ids", popularVenueIds: [], popularProviderIds: [] },
      { status: 500 }
    );
  }
}
