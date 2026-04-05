import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { USER_INPUT_MAX } from "@/lib/userInputValidation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const venueId = Number((body as { venueId?: unknown }).venueId);
  if (
    !Number.isInteger(venueId) ||
    venueId <= 0 ||
    venueId > USER_INPUT_MAX.PRICE_MAX
  ) {
    return NextResponse.json({ error: "Invalid venue" }, { status: 400 });
  }

  const exists = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.venuePageView.create({
      data: { venueId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("venue-view:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
