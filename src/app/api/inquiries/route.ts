import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { DEFAULT_INQUIRY_SEEKER_MESSAGE } from "@/lib/inquiryMessageDisplay";
import { normalizeInquiryServiceChoices } from "@/lib/venueInquiryAmenities";

export const runtime = "nodejs";

/** שליחת פנייה לאולם – משתמש מחובר בלבד */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר כדי לשלוח פנייה" }, { status: 401 });
  }
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "שליחת פנייה זמינה למחפשי אולמות בלבד" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const venueId = body.venueId != null ? Number(body.venueId) : NaN;
  let message = (body.message as string)?.trim() ?? "";
  const preferredDateRaw = (body.preferredDate as string)?.trim() || null;
  const eventType = (body.eventType as string)?.trim() || null;
  const guestCount = body.guestCount != null && body.guestCount !== "" ? Number(body.guestCount) : null;

  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "נא לבחור אולם" }, { status: 400 });
  }
  if (!preferredDateRaw) {
    return NextResponse.json({ error: "נא לבחור תאריך אירוע" }, { status: 400 });
  }
  const preferredDateParsed = new Date(preferredDateRaw);
  if (Number.isNaN(preferredDateParsed.getTime())) {
    return NextResponse.json({ error: "תאריך לא תקין" }, { status: 400 });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  preferredDateParsed.setHours(0, 0, 0, 0);
  if (preferredDateParsed < today) {
    return NextResponse.json({ error: "נא לבחור תאריך שעדיין לא עבר" }, { status: 400 });
  }
  const preferredDate = preferredDateRaw;

  if (guestCount == null || !Number.isFinite(guestCount) || guestCount < 1) {
    return NextResponse.json({ error: "נא לציין כמות אורחים צפויה" }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      id: true,
      minGuests: true,
      maxGuests: true,
      ownerId: true,
      name: true,
      autoReplyMessage: true,
      hasChuppa: true,
      hasChuppaOutdoor: true,
      hasChuppaCovered: true,
      hasFood: true,
      hasDanceFloor: true,
      hasTableSetup: true,
      hasSoundSystem: true,
      hasBridalRoom: true,
      customAmenitiesJson: true,
    },
  });
  if (!venue) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  if (guestCount != null && Number.isFinite(guestCount)) {
    if (venue.minGuests != null && guestCount < venue.minGuests) {
      return NextResponse.json(
        { error: `כמות אורחים לא יכולה להיות פחות מ־${venue.minGuests} (מינימום האולם)` },
        { status: 400 }
      );
    }
    if (venue.maxGuests != null && guestCount > venue.maxGuests) {
      return NextResponse.json(
        { error: `כמות אורחים לא יכולה להיות יותר מ־${venue.maxGuests} (מקסימום האולם)` },
        { status: 400 }
      );
    }
  }

  const serviceRows = normalizeInquiryServiceChoices(
    venue,
    body.serviceChoices,
    eventType
  );
  const serviceChoicesJson =
    serviceRows.length > 0 ? JSON.stringify(serviceRows) : null;

  if (!message || message.length < 10) {
    message = DEFAULT_INQUIRY_SEEKER_MESSAGE;
  } else {
    message = message.trim();
  }

  let inquiry;
  try {
    inquiry = await prisma.inquiry.create({
      data: {
        userId: user.id,
        venueId,
        message,
        eventType,
        preferredDate,
        guestCount: guestCount != null && Number.isFinite(guestCount) ? guestCount : null,
        serviceChoicesJson,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "לא ניתן לשמור את הפנייה בגלל כפילות במסד הנתונים (למשל הגבלה ישנה לפנייה אחת לאולם). הרץ `npx prisma migrate deploy` או `npx prisma db push` כדי לעדכן — אחרי זה אפשר לשלוח כמה פניות לאותו אולם.",
        },
        { status: 409 }
      );
    }
    throw e;
  }

  await createNotification({
    userId: venue.ownerId,
    type: "NEW_REQUEST",
    title: "בקשה חדשה לאולם",
    body: `התקבלה פנייה חדשה עבור "${venue.name}".`,
    href: `/dashboard/venue-owner/inquiries/${inquiry.id}`,
  });

  const autoText = venue.autoReplyMessage?.trim();
  let resultInquiry = inquiry;
  if (autoText && autoText.length > 0) {
    await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        ownerNote: autoText,
        status: "REPLIED",
        repliedAt: new Date(),
        autoReplyApplied: true,
      },
    });
    await createNotification({
      userId: user.id,
      type: "INQUIRY_REPLIED",
      title: "פנייה נענתה",
      body: `התקבלה תשובה אוטומטית לפנייה עבור "${venue.name}".`,
      href: "/my-inquiries",
    });
    const updated = await prisma.inquiry.findUnique({ where: { id: inquiry.id } });
    if (updated) resultInquiry = updated;
  }

  return NextResponse.json({ inquiry: resultInquiry }, { status: 201 });
}
