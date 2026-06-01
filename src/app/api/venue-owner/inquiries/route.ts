import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { notifySeekerInquiryReplied } from "@/lib/transactionalEmails";
import {
  USER_INPUT_MAX,
  badRequest,
  validateOptionalLongText,
} from "@/lib/userInputValidation";

export const runtime = "nodejs";

/** רשימת פניות לכל האולמות של בעל האולם */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const venues = await prisma.venue.findMany({
    where: { ownerId: user.id },
    select: { id: true, name: true },
  });
  const venueIds = venues.map((v) => v.id);

  const inquiries = await prisma.inquiry.findMany({
    where: { venueId: { in: venueIds } },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      venue: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json({ inquiries, venues });
}

/** סימון פנייה כ־נקראה או נענתה */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = body.id != null ? Number(body.id) : NaN;

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid inquiry id" }, { status: 400 });
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: { id },
    include: {
      venue: { select: { ownerId: true, name: true } },
      user: { select: { email: true, name: true } },
    },
  });
  if (!inquiry || inquiry.venue.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  /** עדכון או מחיקת הערת בעל האולם בלבד (פנייה שכבר סומנה כנענה) */
  if (body.updateOwnerNoteOnly === true) {
    if (inquiry.status !== "REPLIED") {
      return NextResponse.json(
        { error: "ניתן לערוך הערה רק בפנייה שסומנה כנענה" },
        { status: 400 }
      );
    }
    let nextNote: string | null;
    if (body.deleteOwnerNote === true) {
      nextNote = null;
    } else if (typeof body.ownerNote === "string") {
      const noteRes = validateOptionalLongText(
        body.ownerNote,
        USER_INPUT_MAX.OWNER_OR_PROVIDER_NOTE,
        "הערה"
      );
      if (!noteRes.ok) return badRequest(noteRes.error);
      nextNote = noteRes.value;
    } else {
      return NextResponse.json({ error: "חסר תוכן ההערה" }, { status: 400 });
    }
    /** בלי הערה — הפנייה לא נחשבת יותר "נענה" */
    const clearingAnsweredState = nextNote === null;
    await prisma.inquiry.update({
      where: { id },
      data: {
        ownerNote: nextNote,
        ...(clearingAnsweredState
          ? {
              status: "READ",
              repliedAt: null,
            }
          : {}),
      },
    });
    return NextResponse.json({ ok: true });
  }

  const statusRaw = (body.status as string)?.toUpperCase();
  const status =
    statusRaw === "REPLIED" ? "REPLIED" : statusRaw === "READ" ? "READ" : "NEW";
  let ownerNote: string | null = null;
  if (typeof body.ownerNote === "string") {
    const noteRes = validateOptionalLongText(
      body.ownerNote,
      USER_INPUT_MAX.OWNER_OR_PROVIDER_NOTE,
      "הערה"
    );
    if (!noteRes.ok) return badRequest(noteRes.error);
    ownerNote = noteRes.value;
  }

  await prisma.inquiry.update({
    where: { id },
    data: {
      status,
      ownerNote: status === "REPLIED" ? ownerNote : inquiry.ownerNote,
      repliedAt: status === "REPLIED" ? new Date() : inquiry.repliedAt,
    },
  });

  if (status === "REPLIED" && inquiry.status !== "REPLIED") {
    await createNotification({
      userId: inquiry.userId,
      type: "INQUIRY_REPLIED",
      title: "פנייה נענתה",
      body: `בעל האולם ענה לפנייה שלך עבור "${inquiry.venue.name}".`,
      href: "/my-inquiries",
    });
    if (inquiry.user.email) {
      notifySeekerInquiryReplied({
        seekerEmail: inquiry.user.email,
        seekerName: inquiry.user.name,
        venueName: inquiry.venue.name,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
