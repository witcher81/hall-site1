import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { packageRowToClient, parseEventPackageWriteBody, prismaDataFromPackageWrite } from "@/lib/eventPackageForm";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function assertVenueOwner(userId: number, venueId: number) {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ownerId: userId },
    select: { id: true },
  });
  return venue != null;
}

async function validateServiceIds(serviceIds: number[]) {
  if (serviceIds.length === 0) return { ok: true as const };
  const found = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true },
  });
  const foundIds = new Set(found.map((s) => s.id));
  const missing = serviceIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    return { ok: false as const, error: "אחד או יותר מהשירותים שנבחרו לא קיימים במערכת" };
  }
  return { ok: true as const };
}

const packageInclude = {
  services: { select: { serviceId: true } },
} as const;

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
    include: packageInclude,
  });

  return NextResponse.json({ packages: packages.map(packageRowToClient) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const venueId = Number(body.venueId);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "חובה venueId" }, { status: 400 });
  }
  if (!(await assertVenueOwner(user.id, venueId))) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  const parsed = parseEventPackageWriteBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!parsed.data.title) {
    return NextResponse.json({ error: "חובה כותרת" }, { status: 400 });
  }

  const serviceIds = parsed.data.serviceIds ?? [];
  const svcCheck = await validateServiceIds(serviceIds);
  if (!svcCheck.ok) return NextResponse.json({ error: svcCheck.error }, { status: 400 });

  const data = prismaDataFromPackageWrite(parsed.data);
  const pkg = await prisma.eventPackage.create({
    data: {
      venueId,
      title: parsed.data.title,
      ...data,
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

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
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

  const parsed = parseEventPackageWriteBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const serviceIds = parsed.data.serviceIds;
  if (serviceIds) {
    const svcCheck = await validateServiceIds(serviceIds);
    if (!svcCheck.ok) return NextResponse.json({ error: svcCheck.error }, { status: 400 });
  }

  const data = prismaDataFromPackageWrite(parsed.data);

  await prisma.$transaction(async (tx) => {
    await tx.eventPackage.update({
      where: { id },
      data,
    });
    if (serviceIds) {
      await tx.eventPackageService.deleteMany({ where: { packageId: id } });
      if (serviceIds.length > 0) {
        await tx.eventPackageService.createMany({
          data: serviceIds.map((serviceId) => ({ packageId: id, serviceId })),
        });
      }
    }
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
