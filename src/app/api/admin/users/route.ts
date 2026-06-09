import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isBlocked: true,
      createdAt: true,
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

  if (typeof body.isBlocked === "boolean") {
    await prisma.user.update({
      where: { id },
      data: { isBlocked: body.isBlocked },
    });
  }

  return NextResponse.json({ ok: true });
}
