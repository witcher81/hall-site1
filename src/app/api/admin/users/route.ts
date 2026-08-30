import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { deleteUserAccount } from "@/lib/deleteUserAccount";

export const runtime = "nodejs";

const DEFAULT_TAKE = 50;
const MAX_TAKE = 200;

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isBlocked: true,
  emailVerified: true,
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

const listSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isBlocked: true,
  emailVerified: true,
  createdAt: true,
  adminReviewedAt: true,
  businessName: true,
};

type UserListWhere = {
  role?: string | { in: string[] };
  isBlocked?: boolean;
  emailVerified?: boolean;
  adminReviewedAt?: null;
  OR?: Array<{
    email?: { contains: string; mode: "insensitive" };
    name?: { contains: string; mode: "insensitive" };
    businessName?: { contains: string; mode: "insensitive" };
  }>;
};

function parseListWhere(req: NextRequest): UserListWhere {
  const focus = req.nextUrl.searchParams.get("focus")?.trim() ?? "";
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const role = req.nextUrl.searchParams.get("role")?.trim() ?? "";
  const status = req.nextUrl.searchParams.get("status")?.trim() ?? "";

  const where: UserListWhere = {};

  if (focus === "new-business") {
    where.role = { in: ["VENUE_OWNER", "FREELANCER"] };
    where.isBlocked = false;
    where.adminReviewedAt = null;
  }

  if (role === "SEEKER" || role === "VENUE_OWNER" || role === "FREELANCER") {
    where.role = role;
  }

  if (status === "blocked") {
    where.isBlocked = true;
  } else if (status === "unverified") {
    where.emailVerified = false;
  } else if (status === "unreviewed") {
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

  return where;
}

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

  const where = parseListWhere(req);
  const skipRaw = Number(req.nextUrl.searchParams.get("skip") ?? "0");
  const takeRaw = Number(req.nextUrl.searchParams.get("take") ?? String(DEFAULT_TAKE));
  const skip = Number.isInteger(skipRaw) && skipRaw >= 0 ? skipRaw : 0;
  const take = Number.isInteger(takeRaw)
    ? Math.min(Math.max(takeRaw, 1), MAX_TAKE)
    : DEFAULT_TAKE;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: listSelect,
    }),
  ]);

  return NextResponse.json({ users, total, skip, take });
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

export async function DELETE(req: NextRequest) {
  const { denied, user: admin } = await requireAdminApi();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  const confirmEmail =
    typeof body.confirmEmail === "string" ? body.confirmEmail.trim() : "";

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
  if (!target) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  if (isAdminEmail(target.email)) {
    return NextResponse.json(
      { error: "לא ניתן למחוק חשבון אדמין" },
      { status: 403 }
    );
  }

  if (admin && target.id === admin.id) {
    return NextResponse.json(
      { error: "לא ניתן למחוק את החשבון המחובר כרגע" },
      { status: 403 }
    );
  }

  if (!confirmEmail || confirmEmail.toLowerCase() !== target.email.toLowerCase()) {
    return NextResponse.json(
      { error: "יש להקליד את כתובת האימייל של המשתמש לאישור המחיקה" },
      { status: 400 }
    );
  }

  try {
    await deleteUserAccount(target.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "לא ניתן למחוק — עדיין יש נתונים מקושרים. נסו שוב או פנו לתמיכה.",
        },
        { status: 409 }
      );
    }
    console.error("admin delete user:", e);
    return NextResponse.json({ error: "מחיקת המשתמש נכשלה" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deletedId: target.id });
}
