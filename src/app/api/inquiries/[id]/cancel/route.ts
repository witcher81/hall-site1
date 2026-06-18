import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  canSeekerCancel,
  normalizeInquiryStatus,
} from "@/lib/inquiryStatus";
import {
  finalizeInquiryCancellation,
  notifyInquiryCancelled,
} from "@/lib/inquiryCancellation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** ביטול בקשת הזמנה על ידי המזמין */
export async function POST(_req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idRaw } = await context.params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid inquiry id" }, { status: 400 });
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      status: true,
      preferredDate: true,
      venue: { select: { id: true, name: true } },
    },
  });
  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canSeekerCancel(inquiry.status)) {
    return NextResponse.json(
      { error: "לא ניתן לבטל בקשה שכבר בוטלה או נדחתה." },
      { status: 400 }
    );
  }

  const wasApproved = normalizeInquiryStatus(inquiry.status) === "APPROVED";

  await prisma.inquiry.update({
    where: { id },
    data: { status: "CANCELLED", repliedAt: new Date() },
  });

  await notifyInquiryCancelled({
    inquiryId: id,
    actorUserId: user.id,
    actor: "SEEKER",
  });

  await finalizeInquiryCancellation({
    inquiryId: id,
    releaseBookedDate: wasApproved,
    venueId: inquiry.venue.id,
    preferredDate: inquiry.preferredDate,
  });

  return NextResponse.json({ ok: true, status: "CANCELLED" });
}
