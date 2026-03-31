import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { dbScoreToStars, parseHalfStarRating, starsToDbScore } from "@/lib/reviewRating";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const venueId = Number(id);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "invalid venue id" }, { status: 400 });
  }

  const reviewsRaw = await prisma.venueReview.findMany({
    where: { venueId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
    },
  });

  const reviews = reviewsRaw.map((r) => ({
    ...r,
    rating: dbScoreToStars(Number(r.rating)),
  }));

  const average =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return NextResponse.json({
    average: Math.round(average * 10) / 10,
    count: reviews.length,
    reviews,
  });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const venueId = Number(id);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "invalid venue id" }, { status: 400 });
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

  const duplicate = await prisma.venueReview.findFirst({
    where: { venueId, userId: user.id },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json(
      {
        error:
          "כבר שלחת ביקורת לאולם זה. אפשר לערוך או למחוק את הביקורת הקיימת.",
        existingReviewId: duplicate.id,
      },
      { status: 409 }
    );
  }

  const review = await prisma.venueReview.create({
    data: {
      venueId,
      userId: user.id,
      rating: ratingScore,
      comment: comment || null,
    },
  });

  return NextResponse.json({ ok: true, reviewId: review.id });
}

