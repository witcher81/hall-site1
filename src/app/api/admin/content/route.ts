import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** הסרת אולם או שירות על ידי אדמין */
export async function DELETE(req: NextRequest) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const type = req.nextUrl.searchParams.get("type")?.trim();
  const id = Number(req.nextUrl.searchParams.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  if (type === "venue") {
    await prisma.inquiry.deleteMany({ where: { venueId: id } });
    await prisma.favorite.deleteMany({ where: { venueId: id } });
    await prisma.venueReview.deleteMany({ where: { venueId: id } });
    await prisma.venueAvailability.deleteMany({ where: { venueId: id } });
    await prisma.conversation.deleteMany({ where: { venueId: id } });
    await prisma.venue.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  if (type === "service") {
    await prisma.conversation.updateMany({
      where: { serviceId: id },
      data: { serviceId: null },
    });
    await prisma.serviceRequest.deleteMany({ where: { serviceId: id } });
    await prisma.serviceFavorite.deleteMany({ where: { serviceId: id } });
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "סוג לא נתמך" }, { status: 400 });
}
