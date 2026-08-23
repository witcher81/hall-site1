import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isBlocked: true,
  createdAt: true,
  adminReviewedAt: true,
  businessName: true,
  businessBio: true,
  profileImageUrl: true,
  venues: {
    select: {
      id: true,
      name: true,
      city: true,
      moderationStatus: true,
      coverImageUrl: true,
    },
    orderBy: { createdAt: "desc" as const },
    take: 20,
  },
  services: {
    select: {
      id: true,
      name: true,
      category: true,
      moderationStatus: true,
      coverImageUrl: true,
    },
    orderBy: { createdAt: "desc" as const },
    take: 20,
  },
};

export async function GET(req: NextRequest) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const idParam = req.nextUrl.searchParams.get("id")?.trim();
  if (idParam) {
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) {
      return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
    }
    return NextResponse.json({ user });
  }

  const focus = req.nextUrl.searchParams.get("focus")?.trim() ?? "";
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const where: {
    role?: { in: string[] };
    isBlocked?: boolean;
    adminReviewedAt?: null;
    OR?: Array<{
      email?: { contains: string; mode: "insensitive" };
      name?: { contains: string; mode: "insensitive" };
      businessName?: { contains: string; mode: "insensitive" };
    }>;
  } = {};

  if (focus === "new-business") {
    where.role = { in: ["VENUE_OWNER", "FREELANCER"] };
    where.isBlocked = false;
    where.adminReviewedAt = null;
  }

  if (q.length >= 2) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { businessName: { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: userSelect,
  });

  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const data: {
    isBlocked?: boolean;
    adminReviewedAt?: Date | null;
  } = {};

  if (typeof body.isBlocked === "boolean") {
    data.isBlocked = body.isBlocked;
  }
  if (body.markReviewed === true) {
    data.adminReviewedAt = new Date();
  }
  if (body.markReviewed === false) {
    data.adminReviewedAt = null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "אין מה לעדכן" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true });
}
