import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function assertVenueOwner(userId: number, venueId: number) {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ownerId: userId },
    select: { id: true },
  });
  return venue != null;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const venueId = Number(req.nextUrl.searchParams.get("venueId"));
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "חסר venueId" }, { status: 400 });
  }
  if (!(await assertVenueOwner(user.id, venueId))) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  const packages = await prisma.eventPackage.findMany({
    where: { venueId },
    orderBy: { sortOrder: "asc" },
    include: {
      services: { select: { serviceId: true } },
    },
  });

  return NextResponse.json({ packages });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const venueId = Number(body.venueId);
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
  if (!Number.isInteger(venueId) || venueId <= 0 || !title) {
    return NextResponse.json({ error: "חובה venueId וכותרת" }, { status: 400 });
  }
  if (!(await assertVenueOwner(user.id, venueId))) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  const serviceIds: number[] = Array.isArray(body.serviceIds)
    ? body.serviceIds
        .map((x: unknown) => Number(x))
        .filter((n: number) => Number.isInteger(n) && n > 0)
    : [];

  if (serviceIds.length > 0) {
    const found = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((s) => s.id));
    const missing = serviceIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "אחד או יותר מהשירותים שנבחרו לא קיימים במערכת" },
        { status: 400 }
      );
    }
  }

  const pkg = await prisma.eventPackage.create({
    data: {
      venueId,
      title,
      subtitle:
        typeof body.subtitle === "string" ? body.subtitle.trim().slice(0, 300) : null,
      description:
        typeof body.description === "string" ? body.description.trim().slice(0, 5000) : null,
      bundlePriceFrom:
        body.bundlePriceFrom != null ? Number(body.bundlePriceFrom) || null : null,
      bundlePriceTo:
        body.bundlePriceTo != null ? Number(body.bundlePriceTo) || null : null,
      badgeLabel:
        typeof body.badgeLabel === "string" ? body.badgeLabel.trim().slice(0, 80) : null,
      isPublished: body.isPublished !== false,
      services: {
        create: serviceIds.map((serviceId) => ({ serviceId })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: pkg.id });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const existing = await prisma.eventPackage.findFirst({
    where: { id, venue: { ownerId: user.id } },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "חבילה לא נמצאה" }, { status: 404 });
  }

  await prisma.eventPackage.update({
    where: { id },
    data: {
      title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : undefined,
      subtitle:
        typeof body.subtitle === "string" ? body.subtitle.trim().slice(0, 300) : undefined,
      isPublished: typeof body.isPublished === "boolean" ? body.isPublished : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const existing = await prisma.eventPackage.findFirst({
    where: { id, venue: { ownerId: user.id } },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "חבילה לא נמצאה" }, { status: 404 });
  }

  await prisma.eventPackage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
