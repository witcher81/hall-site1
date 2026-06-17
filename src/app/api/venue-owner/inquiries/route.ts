import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { userWantsEmailFromDb } from "@/lib/emailNotifications";
import {
  notifySeekerInquiryApproved,
  notifySeekerInquiryRejected,
  notifySeekerInquiryReplied,
  notifySeekerInquiryViewed,
} from "@/lib/transactionalEmails";
import { bookVenueDateForInquiry } from "@/lib/inquiryBookDate";
import {
  finalizeInquiryCancellation,
  notifyInquiryCancelled,
} from "@/lib/inquiryCancellation";
import {
  canOwnerApprove,
  canOwnerReject,
  normalizeInquiryStatus,
} from "@/lib/inquiryStatus";
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

function parseOwnerNote(body: Record<string, unknown>): string | null | undefined {
  if (typeof body.ownerNote !== "string") return undefined;
  const noteRes = validateOptionalLongText(
    body.ownerNote,
    USER_INPUT_MAX.OWNER_OR_PROVIDER_NOTE,
    "הערה"
  );
  if (!noteRes.ok) return null;
  return noteRes.value;
}

async function notifySeekerApproved(inquiry: {
  userId: number;
  id: number;
  user: { email: string; name: string | null };
  venue: { name: string };
}) {
  await createNotification({
    userId: inquiry.userId,
    type: "INQUIRY_APPROVED",
    title: "ההזמנה אושרה",
    body: `בעל האולם אישר את ההזמנה עבור "${inquiry.venue.name}".`,
    href: `/my-inquiries/${inquiry.id}`,
  });
  if (
    inquiry.user.email &&
    (await userWantsEmailFromDb(inquiry.userId, "inquiryReply"))
  ) {
    notifySeekerInquiryApproved({
      seekerEmail: inquiry.user.email,
      seekerName: inquiry.user.name,
      venueName: inquiry.venue.name,
      inquiryId: inquiry.id,
    });
  }
}

async function notifySeekerRejected(inquiry: {
  userId: number;
  id: number;
  user: { email: string; name: string | null };
  venue: { name: string };
}) {
  await createNotification({
    userId: inquiry.userId,
    type: "INQUIRY_REJECTED",
    title: "ההזמנה נדחתה",
    body: `בעל האולם דחה את בקשת ההזמנה עבור "${inquiry.venue.name}".`,
    href: `/my-inquiries/${inquiry.id}`,
  });
  if (
    inquiry.user.email &&
    (await userWantsEmailFromDb(inquiry.userId, "inquiryReply"))
  ) {
    notifySeekerInquiryRejected({
      seekerEmail: inquiry.user.email,
      seekerName: inquiry.user.name,
      venueName: inquiry.venue.name,
      inquiryId: inquiry.id,
    });
  }
}

async function notifySeekerViewed(inquiry: {
  userId: number;
  id: number;
  user: { email: string; name: string | null };
  venue: { name: string };
}) {
  await createNotification({
    userId: inquiry.userId,
    type: "INQUIRY_VIEWED",
    title: "בעל האולם ראה את הבקשה",
    body: `«${inquiry.venue.name}» צפה בבקשת ההזמנה שלכם ויענה בהקדם האפשרי.`,
    href: `/my-inquiries/${inquiry.id}`,
  });
  if (
    inquiry.user.email &&
    (await userWantsEmailFromDb(inquiry.userId, "inquiryReply"))
  ) {
    notifySeekerInquiryViewed({
      seekerEmail: inquiry.user.email,
      seekerName: inquiry.user.name,
      venueName: inquiry.venue.name,
      inquiryId: inquiry.id,
    });
  }
}

/** סימון פנייה, אישור או דחייה */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = body.id != null ? Number(body.id) : NaN;

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid inquiry id" }, { status: 400 });
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: { id },
    include: {
      venue: { select: { ownerId: true, name: true, id: true } },
      user: { select: { id: true, email: true, name: true } },
    },
  });
  if (!inquiry || inquiry.venue.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const action =
    typeof body.action === "string" ? body.action.trim().toLowerCase() : "";

  if (action === "approve" || action === "reject") {
    const noteParsed = parseOwnerNote(body);
    if (noteParsed === null) {
      return badRequest("הערה ארוכה מדי");
    }

    if (action === "approve") {
      if (!canOwnerApprove(inquiry.status)) {
        return NextResponse.json(
          { error: "לא ניתן לאשר פנייה שכבר אושרה או נדחתה." },
          { status: 400 }
        );
      }
      const book = await bookVenueDateForInquiry(
        inquiry.venue.id,
        inquiry.preferredDate
      );
      if (!book.ok) {
        return NextResponse.json({ error: book.error }, { status: book.status });
      }
      await prisma.inquiry.update({
        where: { id },
        data: {
          status: "APPROVED",
          ownerNote: noteParsed ?? inquiry.ownerNote,
          repliedAt: new Date(),
        },
      });
      if (inquiry.status !== "APPROVED") {
        await notifySeekerApproved(inquiry);
      }
      return NextResponse.json({ ok: true, status: "APPROVED" });
    }

    if (!canOwnerReject(inquiry.status)) {
      return NextResponse.json(
        { error: "לא ניתן לדחות פנייה שכבר אושרה או נדחתה." },
        { status: 400 }
      );
    }
    await prisma.inquiry.update({
      where: { id },
      data: {
        status: "REJECTED",
        ownerNote: noteParsed ?? inquiry.ownerNote,
        repliedAt: new Date(),
      },
    });
    if (inquiry.status !== "REJECTED") {
      await notifySeekerRejected(inquiry);
      await notifyInquiryCancelled({
        inquiryId: id,
        actorUserId: user.id,
        actor: "VENUE_OWNER",
        skipSeeker: true,
      });
      await finalizeInquiryCancellation({
        inquiryId: id,
        releaseBookedDate: false,
      });
    }
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  if (action === "cancel") {
    const noteParsed = parseOwnerNote(body);
    if (noteParsed === null) {
      return badRequest("הערה ארוכה מדי");
    }
    if (normalizeInquiryStatus(inquiry.status) !== "APPROVED") {
      return NextResponse.json(
        { error: "ניתן לבטל רק הזמנה שאושרה. לפניות שטרם אושרו — השתמשו בדחייה." },
        { status: 400 }
      );
    }
    await prisma.inquiry.update({
      where: { id },
      data: {
        status: "REJECTED",
        ownerNote: noteParsed ?? inquiry.ownerNote,
        repliedAt: new Date(),
      },
    });
    await notifyInquiryCancelled({
      inquiryId: id,
      actorUserId: user.id,
      actor: "VENUE_OWNER",
    });
    await finalizeInquiryCancellation({
      inquiryId: id,
      releaseBookedDate: true,
      venueId: inquiry.venue.id,
      preferredDate: inquiry.preferredDate,
    });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  /** עדכון או מחיקת הערת בעל האולם בלבד */
  if (body.updateOwnerNoteOnly === true) {
    const current = normalizeInquiryStatus(inquiry.status);
    if (
      current !== "REPLIED" &&
      current !== "APPROVED" &&
      current !== "REJECTED"
    ) {
      return NextResponse.json(
        { error: "ניתן לערוך הערה רק בפנייה שנענתה, אושרה או נדחתה" },
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
    const clearingAnsweredState =
      nextNote === null && current === "REPLIED";
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
  const status = normalizeInquiryStatus(
    statusRaw === "REPLIED"
      ? "REPLIED"
      : statusRaw === "READ"
        ? "READ"
        : statusRaw === "APPROVED"
          ? "APPROVED"
          : statusRaw === "REJECTED"
            ? "REJECTED"
            : "NEW"
  );

  if (status === "APPROVED" || status === "REJECTED") {
    return NextResponse.json(
      { error: "השתמשו ב-action: approve או reject" },
      { status: 400 }
    );
  }

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

  if (status === "READ" && inquiry.status === "NEW") {
    await notifySeekerViewed(inquiry);
  }

  if (status === "REPLIED" && inquiry.status !== "REPLIED") {
    await createNotification({
      userId: inquiry.userId,
      type: "INQUIRY_REPLIED",
      title: "פנייה נענתה",
      body: `בעל האולם ענה לפנייה שלך עבור "${inquiry.venue.name}".`,
      href: `/my-inquiries/${inquiry.id}`,
    });
    if (
      inquiry.user.email &&
      (await userWantsEmailFromDb(inquiry.userId, "inquiryReply"))
    ) {
      notifySeekerInquiryReplied({
        seekerEmail: inquiry.user.email,
        seekerName: inquiry.user.name,
        venueName: inquiry.venue.name,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
