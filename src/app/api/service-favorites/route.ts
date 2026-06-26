import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emailVerificationGuard } from "@/lib/apiAuth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ serviceIds: [], services: [] });
  }

  const favorites = await prisma.serviceFavorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          category: true,
          coverImageUrl: true,
          minPrice: true,
          maxPrice: true,
          providerId: true,
          provider: {
            select: { id: true, name: true, businessName: true },
          },
        },
      },
    },
  });

  return NextResponse.json({
    serviceIds: favorites.map((f) => f.serviceId),
    services: favorites.map((f) => f.service),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }
  const verifyBlock = emailVerificationGuard(user);
  if (verifyBlock) return verifyBlock;

  const body = await req.json().catch(() => ({}));
  const serviceId = Number(body.serviceId);
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return NextResponse.json({ error: "מזהה שירות לא תקין" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true },
  });
  if (!service) {
    return NextResponse.json({ error: "שירות לא נמצא" }, { status: 404 });
  }

  await prisma.serviceFavorite.upsert({
    where: { userId_serviceId: { userId: user.id, serviceId } },
    create: { userId: user.id, serviceId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const verifyBlock = emailVerificationGuard(user);
  if (verifyBlock) return verifyBlock;

  const serviceId = Number(req.nextUrl.searchParams.get("serviceId"));
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  await prisma.serviceFavorite.deleteMany({
    where: { userId: user.id, serviceId },
  });

  return NextResponse.json({ ok: true });
}
