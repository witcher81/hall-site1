import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseDate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const venueId = Number(id);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "Invalid venue id" }, { status: 400 });
  }

  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const defaultTo = new Date(defaultFrom);
  defaultTo.setUTCDate(defaultTo.getUTCDate() + 180);

  const { searchParams } = new URL(req.url);
  const requestedFrom = parseDate(searchParams.get("from") ?? "") ?? defaultFrom;
  const from = requestedFrom < defaultFrom ? defaultFrom : requestedFrom;
  const requestedTo = parseDate(searchParams.get("to") ?? "") ?? defaultTo;

  if (requestedTo < from) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  // תקרת טווח: עד שנה קדימה מ-from — מונע findMany ענק על טווח עתידי קיצוני
  const maxTo = new Date(from);
  maxTo.setUTCDate(maxTo.getUTCDate() + 366);
  const to = requestedTo > maxTo ? maxTo : requestedTo;

  const items = await prisma.venueAvailability.findMany({
    where: {
      venueId,
      date: { gte: from, lte: to },
    },
    orderBy: { date: "asc" },
    select: { date: true, status: true },
  });

  return NextResponse.json({
    availability: items.map((item) => ({
      date: toYmd(item.date),
      status: item.status,
    })),
  });
}

