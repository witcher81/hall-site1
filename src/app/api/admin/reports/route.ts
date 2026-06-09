import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const status = req.nextUrl.searchParams.get("status")?.trim() || "OPEN";
  const reports = await prisma.contentReport.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { id: true, email: true, name: true } },
    },
  });

  return NextResponse.json({ reports });
}

export async function PATCH(req: NextRequest) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  const status = typeof body.status === "string" ? body.status.trim() : "";
  if (!Number.isInteger(id) || id <= 0 || !["OPEN", "RESOLVED", "DISMISSED"].includes(status)) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  await prisma.contentReport.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "OPEN" ? null : new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
