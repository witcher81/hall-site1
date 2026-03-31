import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  const markAll = body.markAll === true;
  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
  }
  const existing = await prisma.notification.findFirst({
    where: { id, userId: user.id },
    select: { id: true, isRead: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!existing.isRead) {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}

