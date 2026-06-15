import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { userWantsEmailFromDb } from "@/lib/emailNotifications";
import {
  notifyVenueOwnerNewInquiry,
} from "@/lib/transactionalEmails";
import { DEFAULT_INQUIRY_SEEKER_MESSAGE } from "@/lib/inquiryMessageDisplay";
import { resolveInquiryAddonServiceChoices } from "@/lib/inquiryAddonFreelancers";
import {
  getInquiryGuestBounds,
  normalizeInquiryServiceChoices,
  validateInquiryEventType,
} from "@/lib/venueInquiryAmenities";
import {
  USER_INPUT_MAX,
  validateGuestCount,
  badRequest,
} from "@/lib/userInputValidation";

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
  let message = typeof body.message === "string" ? body.message.trim() : "";
  const preferredDateRaw = (body.preferredDate as string)?.trim() || null;
  let eventType =
    typeof body.eventType === "string" ? body.eventType.trim() || null : null;
  const guestCount = body.guestCount != null && body.guestCount !== "" ? Number(body.guestCount) : null;

  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "נא לבחור אולם" }, { status: 400 });
  }
  if (message.length > USER_INPUT_MAX.INQUIRY_MESSAGE) {
    return badRequest("הודעת הפנייה ארוכה מדי");
  }
  if (eventType && eventType.length > USER_INPUT_MAX.EVENT_TYPE_FREE) {
    return badRequest("סוג אירוע ארוך מדי");
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

  if (!validateGuestCount(guestCount)) {
    return NextResponse.json({ error: "נא לציין כמות אורחים תקינה" }, { status: 400 });
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
      eventTypes: true,
      hasChuppa: true,
      hasChuppaOutdoor: true,
      hasChuppaCovered: true,
      hasFood: true,
      hasDanceFloor: true,
      hasTableSetup: true,
      hasSoundSystem: true,
      customAmenitiesJson: true,
      venueSoftAttributesJson: true,
      eventTypeProfilesJson: true,
    },
  });
  if (!venue) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  const eventTypeError = validateInquiryEventType(venue.eventTypes, eventType);
  if (eventTypeError) {
    return badRequest(eventTypeError);
  }

  const booked = await prisma.venueAvailability.findUnique({
    where: {
      venueId_date: {
        venueId,
        date: preferredDateParsed,
      },
    },
    select: { status: true },
  });
  if (booked?.status === "BOOKED") {
    return NextResponse.json(
      { error: "התאריך שבחרת מסומן כתפוס אצל האולם. בחרו תאריך אחר בלוח השנה." },
      { status: 400 }
    );
  }

  const guestBounds = getInquiryGuestBounds(venue, eventType);
  if (guestCount != null && Number.isFinite(guestCount)) {
    if (guestBounds.min != null && guestCount < guestBounds.min) {
      return NextResponse.json(
        {
          error: `כמות אורחים לא יכולה להיות פחות מ־${guestBounds.min}${
            eventType ? ` (מינימום ל«${eventType}»)` : " (מינימום האולם)"
          }`,
        },
        { status: 400 }
      );
    }
    if (guestBounds.max != null && guestCount > guestBounds.max) {
      return NextResponse.json(
        {
          error: `כמות אורחים לא יכולה להיות יותר מ־${guestBounds.max}${
            eventType ? ` (מקסימום ל«${eventType}»)` : " (מקסימום האולם)"
          }`,
        },
        { status: 400 }
      );
    }
  }

  const serviceRows = normalizeInquiryServiceChoices(
    venue,
    body.serviceChoices,
    eventType
  );
  const addonRows = await resolveInquiryAddonServiceChoices(body.addonServiceIds);
  const mergedServiceRows = [...serviceRows, ...addonRows];
  const serviceChoicesJson =
    mergedServiceRows.length > 0 ? JSON.stringify(mergedServiceRows) : null;

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

  const ownerUser = await prisma.user.findUnique({
    where: { id: venue.ownerId },
    select: { email: true, name: true },
  });
  if (
    ownerUser?.email &&
    (await userWantsEmailFromDb(venue.ownerId, "newInquiry"))
  ) {
    notifyVenueOwnerNewInquiry({
      ownerEmail: ownerUser.email,
      ownerName: ownerUser.name,
      venueName: venue.name,
      inquiryId: inquiry.id,
      seekerName: user.name,
      preferredDate,
      eventType,
    });
  }

  const autoText = venue.autoReplyMessage?.trim();
  let resultInquiry = inquiry;
  if (autoText && autoText.length > 0) {
    await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        ownerNote: autoText,
        autoReplyApplied: true,
      },
    });
    await createNotification({
      userId: user.id,
      type: "INQUIRY_AUTO_MESSAGE",
      title: "הודעה מהאולם",
      body: `התקבלה הודעה אוטומטית מ«${venue.name}» — ההזמנה ממתינה לאישור בעל האולם.`,
      href: `/my-inquiries/${inquiry.id}`,
    });
    const updated = await prisma.inquiry.findUnique({ where: { id: inquiry.id } });
    if (updated) resultInquiry = updated;
  }

  return NextResponse.json({ inquiry: resultInquiry }, { status: 201 });
}
