import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emailVerificationGuard } from "@/lib/apiAuth";

export const runtime = "nodejs";

/** רשימת המועדפים של המשתמש */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ favorites: [], venueIds: [] }, { status: 200 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { venueId: true },
  });
  const venueIds = favorites.map((f) => f.venueId);

  const venues = await prisma.venue.findMany({
    where: { id: { in: venueIds } },
    select: {
      id: true,
      name: true,
      city: true,
      address: true,
      minGuests: true,
      maxGuests: true,
      minPrice: true,
      maxPrice: true,
      hallRentalMin: true,
      hallRentalMax: true,
      description: true,
      coverImageUrl: true,
      galleryImageUrls: true,
    },
  });

  const venueList = venues.map((v) => ({
    ...v,
    galleryImageUrls: v.galleryImageUrls ? (JSON.parse(v.galleryImageUrls) as string[]) : [],
  }));

  return NextResponse.json({ favorites: venueList, venueIds });
}

/** הוספת אולם למועדפים */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר כדי לשמור מועדפים" }, { status: 401 });
  }
  const verifyBlock = emailVerificationGuard(user);
  if (verifyBlock) return verifyBlock;

  const body = await req.json().catch(() => ({}));
  const venueId = body.venueId != null ? Number(body.venueId) : NaN;

  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "Invalid venue id" }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { id: true },
  });
  if (!venue) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  await prisma.favorite.upsert({
    where: {
      userId_venueId: { userId: user.id, venueId },
    },
    create: { userId: user.id, venueId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

/** הסרת אולם מהמועדפים */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const verifyBlock = emailVerificationGuard(user);
  if (verifyBlock) return verifyBlock;

  const { searchParams } = new URL(req.url);
  const venueId = searchParams.get("venueId");
  const id = venueId ? Number(venueId) : NaN;

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid venue id" }, { status: 400 });
  }

  await prisma.favorite.deleteMany({
    where: { userId: user.id, venueId: id },
  });

  return NextResponse.json({ ok: true });
}
