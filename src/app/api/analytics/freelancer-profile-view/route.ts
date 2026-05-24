import { NextRequest, NextResponse } from "next/server";
import { assertAnalyticsViewRequest } from "@/lib/analyticsViewGuard";
import { prisma } from "@/lib/prisma";
import { ENGAGED_VIEW_MIN_MS } from "@/lib/popularityConfig";
import { USER_INPUT_MAX } from "@/lib/userInputValidation";

export const runtime = "nodejs";

const MAX_VIEWS_PER_PROVIDER_PER_HOUR = 80;

export async function POST(req: NextRequest) {
  if (!assertAnalyticsViewRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const providerUserId = Number((body as { providerUserId?: unknown }).providerUserId);
  const dwellMs = Number((body as { dwellMs?: unknown }).dwellMs);

  if (
    !Number.isInteger(providerUserId) ||
    providerUserId <= 0 ||
    providerUserId > USER_INPUT_MAX.PRICE_MAX
  ) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  if (
    !Number.isFinite(dwellMs) ||
    dwellMs < ENGAGED_VIEW_MIN_MS ||
    dwellMs > 60 * 60 * 1000
  ) {
    return NextResponse.json({ error: "Invalid dwell time" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: providerUserId, role: "FREELANCER" },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.freelancerProfileView.count({
    where: { providerUserId, createdAt: { gte: hourAgo } },
  });
  if (recentCount >= MAX_VIEWS_PER_PROVIDER_PER_HOUR) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await prisma.freelancerProfileView.create({
      data: { providerUserId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("freelancer-profile-view:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
