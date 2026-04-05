import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { USER_INPUT_MAX, badRequest } from "@/lib/userInputValidation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toUtcDateOnly(input: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const date = new Date(`${input}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const venueId = Number(id);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "Invalid venue id" }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { id: true, ownerId: true },
  });

  if (!venue || venue.ownerId !== user.id) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const availability = await prisma.venueAvailability.findMany({
    where: { venueId, date: { gte: today } },
    orderBy: { date: "asc" },
    select: { id: true, date: true, status: true },
  });

  const inquiries = await prisma.inquiry.findMany({
    where: { venueId },
    select: { preferredDate: true },
  });

  const inquiryCounts: Record<string, number> = {};
  for (const item of inquiries) {
    const raw = item.preferredDate?.trim() ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) continue;
    if (raw < today.toISOString().slice(0, 10)) continue;
    inquiryCounts[raw] = (inquiryCounts[raw] ?? 0) + 1;
  }

  return NextResponse.json({ availability, inquiryCounts });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const venueId = Number(id);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "Invalid venue id" }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { id: true, ownerId: true },
  });

  if (!venue || venue.ownerId !== user.id) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as
    | { date?: string; status?: string }
    | null;
  const rawDate = body?.date?.trim() ?? "";
  if (rawDate.length > USER_INPUT_MAX.DATE_STRING) {
    return badRequest("תאריך לא תקין");
  }
  const rawStatus = body?.status?.trim().toUpperCase() ?? "";
  if (rawStatus.length > 16) {
    return badRequest("סטטוס לא תקין");
  }

  const date = toUtcDateOnly(rawDate);
  if (!date) {
    return NextResponse.json({ error: "Invalid date format (YYYY-MM-DD)" }, { status: 400 });
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (date < today) {
    return NextResponse.json({ error: "Past dates are not allowed" }, { status: 400 });
  }
  if (rawStatus !== "FREE" && rawStatus !== "BOOKED") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // ברירת מחדל: כל התאריכים פנויים. שומרים בפועל בעיקר ימים תפוסים.
  if (rawStatus === "FREE") {
    await prisma.venueAvailability.deleteMany({
      where: { venueId, date },
    });
    return NextResponse.json({
      availability: { id: 0, date, status: "FREE" as const },
    });
  }

  const row = await prisma.venueAvailability.upsert({
    where: { venueId_date: { venueId, date } },
    create: { venueId, date, status: "BOOKED" },
    update: { status: "BOOKED" },
    select: { id: true, date: true, status: true },
  });

  return NextResponse.json({ availability: row });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const venueId = Number(id);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "Invalid venue id" }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { id: true, ownerId: true },
  });

  if (!venue || venue.ownerId !== user.id) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const rawDate = (searchParams.get("date") ?? "").trim();
  const date = toUtcDateOnly(rawDate);
  if (!date) {
    return NextResponse.json({ error: "Invalid date format (YYYY-MM-DD)" }, { status: 400 });
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (date < today) {
    return NextResponse.json({ error: "Past dates are not allowed" }, { status: 400 });
  }

  await prisma.venueAvailability.deleteMany({
    where: { venueId, date },
  });

  return NextResponse.json({ ok: true });
}

