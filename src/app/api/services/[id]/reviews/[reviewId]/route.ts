import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseHalfStarRating, starsToDbScore } from "@/lib/reviewRating";
import { USER_INPUT_MAX, badRequest } from "@/lib/userInputValidation";

type RouteContext = {
  params: Promise<{ id: string; reviewId: string }>;
};

async function getReviewForService(serviceId: number, reviewId: number) {
  return prisma.serviceReview.findFirst({
    where: { id: reviewId, serviceId },
    select: { id: true, userId: true },
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, reviewId: rid } = await context.params;
  const serviceId = Number(id);
  const reviewId = Number(rid);
  if (!Number.isInteger(serviceId) || serviceId <= 0 || !Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const existing = await getReviewForService(serviceId, reviewId);
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "לא נמצא או אין הרשאה" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const comment = typeof body?.comment === "string" ? body.comment.trim() : "";
  if (comment.length > USER_INPUT_MAX.REVIEW_COMMENT) {
    return badRequest("תוכן הביקורת ארוך מדי");
  }

  const parsed = parseHalfStarRating(body?.rating);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "דירוג חייב להיות בין 1 ל־5 בחצאי כוכב (1, 1.5, 2, … 5)" },
      { status: 400 }
    );
  }

  await prisma.serviceReview.update({
    where: { id: reviewId },
    data: {
      rating: starsToDbScore(parsed.rating),
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
  const serviceId = Number(id);
  const reviewId = Number(rid);
  if (!Number.isInteger(serviceId) || serviceId <= 0 || !Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const existing = await getReviewForService(serviceId, reviewId);
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "לא נמצא או אין הרשאה" }, { status: 404 });
  }

  await prisma.serviceReview.delete({ where: { id: reviewId } });
  return NextResponse.json({ ok: true });
}
