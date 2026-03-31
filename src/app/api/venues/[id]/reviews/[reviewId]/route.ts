import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseHalfStarRating, starsToDbScore } from "@/lib/reviewRating";

type RouteContext = {
  params: Promise<{ id: string; reviewId: string }>;
};

async function getReviewForVenue(
  venueId: number,
  reviewId: number
) {
  return prisma.venueReview.findFirst({
    where: { id: reviewId, venueId },
    select: { id: true, userId: true },
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, reviewId: rid } = await context.params;
  const venueId = Number(id);
  const reviewId = Number(rid);
  if (!Number.isInteger(venueId) || venueId <= 0 || !Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const existing = await getReviewForVenue(venueId, reviewId);
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "לא נמצא או אין הרשאה" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

  const parsed = parseHalfStarRating(body?.rating);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "דירוג חייב להיות בין 1 ל־5 בחצאי כוכב (1, 1.5, 2, … 5)" },
      { status: 400 }
    );
  }
  const ratingScore = starsToDbScore(parsed.rating);

  await prisma.venueReview.update({
    where: { id: reviewId },
    data: {
      rating: ratingScore,
      comment: comment || null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, reviewId: rid } = await context.params;
  const venueId = Number(id);
  const reviewId = Number(rid);
  if (!Number.isInteger(venueId) || venueId <= 0 || !Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const existing = await getReviewForVenue(venueId, reviewId);
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "לא נמצא או אין הרשאה" }, { status: 404 });
  }

  await prisma.venueReview.delete({
    where: { id: reviewId },
  });

  return NextResponse.json({ ok: true });
}
