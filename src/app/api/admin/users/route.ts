import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const focus = req.nextUrl.searchParams.get("focus")?.trim() ?? "";
  const where =
    focus === "new-business"
      ? {
          role: { in: ["VENUE_OWNER", "FREELANCER"] },
          isBlocked: false,
          adminReviewedAt: null,
        }
      : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isBlocked: true,
      createdAt: true,
      adminReviewedAt: true,
      businessName: true,
      venues: {
        select: {
          id: true,
          name: true,
          moderationStatus: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      services: {
        select: {
          id: true,
          name: true,
          moderationStatus: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
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
