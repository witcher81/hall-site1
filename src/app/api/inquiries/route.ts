import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emailVerificationGuard } from "@/lib/apiAuth";
import { createNotification } from "@/lib/notifications";
import { userWantsEmailFromDb } from "@/lib/emailNotifications";
import {
  notifyVenueOwnerNewInquiry,
} from "@/lib/transactionalEmails";
import { DEFAULT_INQUIRY_SEEKER_MESSAGE } from "@/lib/inquiryMessageDisplay";
import { resolveInquiryAddonServiceChoices, storedServiceChoicesFromAddonPicks, validateAddonFreelancerPaidExtras, type InquiryAddonFreelancerPick } from "@/lib/inquiryAddonFreelancers";
import { enrichInquiryServiceChoicesWithReplacements } from "@/lib/inquiryVenueOptionReplacement";
import { bootstrapNegotiationForNewInquiry } from "@/lib/negotiationThreads";
import {
  collectLinkedMarketplaceServiceIds,
  createSupplierRequestsForInquiry,
} from "@/lib/inquirySupplierOutreach";
import {
  filterSupplierIdsToLinked,
  parseSupplierServiceIds,
} from "@/lib/inquiryLinkedSuppliers";
import {
  legacySingleSupplierMessageEntries,
  parseSupplierMessagesPayload,
  serializeStoredSupplierMessages,
  supplierMessagesMapFromStored,
} from "@/lib/inquirySupplierMessages";
import type { StoredServiceChoice } from "@/lib/venueInquiryAmenities";
import {
  getInquiryGuestBounds,
  normalizeInquiryServiceChoices,
  validateInquiryEventType,
} from "@/lib/venueInquiryAmenities";
import {
  USER_INPUT_MAX,
  validateGuestCount,
  validateOptionalLongText,
  badRequest,
} from "@/lib/userInputValidation";

export const runtime = "nodejs";

function buildSupplierNameMap(rows: StoredServiceChoice[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const row of rows) {
    if (
      typeof row.marketplaceServiceId === "number" &&
      Number.isInteger(row.marketplaceServiceId) &&
      row.marketplaceServiceId > 0
    ) {
      map.set(
        row.marketplaceServiceId,
        row.replacementName?.trim() || row.label.trim() || `ספק #${row.marketplaceServiceId}`
      );
    }
  }
  return map;
}

function parseAddonFreelancerPicks(raw: unknown): InquiryAddonFreelancerPick[] {
  if (!Array.isArray(raw)) return [];
  const out: InquiryAddonFreelancerPick[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const serviceId = Number(o.serviceId);
    if (!Number.isInteger(serviceId) || serviceId <= 0) continue;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const providerName =
      typeof o.providerName === "string" ? o.providerName.trim() : "";
    const category = typeof o.category === "string" ? o.category : null;
    const minPrice =
      typeof o.minPrice === "number" && Number.isFinite(o.minPrice)
        ? Math.trunc(o.minPrice)
        : null;
    const maxPrice =
      typeof o.maxPrice === "number" && Number.isFinite(o.maxPrice)
        ? Math.trunc(o.maxPrice)
        : null;
    let selectedPaidExtras: InquiryAddonFreelancerPick["selectedPaidExtras"];
    if (Array.isArray(o.selectedPaidExtras)) {
      selectedPaidExtras = [];
      for (const pe of o.selectedPaidExtras) {
        if (typeof pe !== "object" || pe === null) continue;
        const p = pe as Record<string, unknown>;
        const label = typeof p.label === "string" ? p.label.trim() : "";
        if (!label) continue;
        selectedPaidExtras.push({
          label,
          description: typeof p.description === "string" ? p.description.trim() : undefined,
          exactPrice:
            typeof p.exactPrice === "number" && Number.isFinite(p.exactPrice)
              ? Math.trunc(p.exactPrice)
              : null,
          minPrice:
            typeof p.minPrice === "number" && Number.isFinite(p.minPrice)
              ? Math.trunc(p.minPrice)
              : null,
          maxPrice:
            typeof p.maxPrice === "number" && Number.isFinite(p.maxPrice)
              ? Math.trunc(p.maxPrice)
              : null,
        });
      }
    }
    out.push({
      serviceId,
      name: name || "שירות במאגר",
      providerName: providerName || "ספק",
      category,
      minPrice,
      maxPrice,
      ...(selectedPaidExtras?.length ? { selectedPaidExtras } : {}),
    });
    if (out.length >= 20) break;
  }
  return out;
}

/** שליחת פנייה לאולם – משתמש מחובר בלבד */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר כדי לשלוח פנייה" }, { status: 401 });
  }
  const verifyBlock = emailVerificationGuard(user);
  if (verifyBlock) return verifyBlock;
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "שליחת פנייה זמינה למחפשי אולמות בלבד" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const venueId = body.venueId != null ? Number(body.venueId) : NaN;
  let message = typeof body.message === "string" ? body.message.trim() : "";
  const supplierMsgRes = validateOptionalLongText(
    body.supplierMessage,
    USER_INPUT_MAX.INQUIRY_MESSAGE,
    "הערות לספקים"
  );
  if (!supplierMsgRes.ok) return badRequest(supplierMsgRes.error);
  const supplierMessage = supplierMsgRes.value;
  const preferredDateRaw = (body.preferredDate as string)?.trim() || null;
  let eventType =
    typeof body.eventType === "string" ? body.eventType.trim() || null : null;
  const guestCount = body.guestCount != null && body.guestCount !== "" ? Number(body.guestCount) : null;
  const eventPackageId =
    body.eventPackageId != null && body.eventPackageId !== ""
      ? Number(body.eventPackageId)
      : null;
  const seekerBundleId =
    body.seekerBundleId != null && body.seekerBundleId !== ""
      ? Number(body.seekerBundleId)
      : null;

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

  if (
    eventPackageId != null &&
    (!Number.isInteger(eventPackageId) || eventPackageId <= 0)
  ) {
    return badRequest("מזהה חבילה לא תקין");
  }
  if (
    seekerBundleId != null &&
    (!Number.isInteger(seekerBundleId) || seekerBundleId <= 0)
  ) {
    return badRequest("מזהה חבילה אישית לא תקין");
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
      hasAcumLicense: true,
      customAmenitiesJson: true,
      venueSoftAttributesJson: true,
      eventTypeProfilesJson: true,
    },
  });
  if (!venue) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  if (eventPackageId != null) {
    const pkg = await prisma.eventPackage.findFirst({
      where: { id: eventPackageId, venueId },
      select: { id: true },
    });
    if (!pkg) {
      return badRequest("החבילה שנבחרה אינה שייכת לאולם זה");
    }
  }

  if (seekerBundleId != null) {
    const bundle = await prisma.seekerEventBundle.findFirst({
      where: { id: seekerBundleId, userId: user.id },
      select: { id: true },
    });
    if (!bundle) {
      return badRequest("חבילת האירוע האישית לא נמצאה");
    }
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
  const enrichedServiceRows = await enrichInquiryServiceChoicesWithReplacements(
    serviceRows,
    body.serviceChoices,
    async (ids) =>
      prisma.service.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          provider: { select: { name: true, businessName: true } },
        },
      })
  );
  const addonPicks = parseAddonFreelancerPicks(body.addonFreelancers);
  const paidExtrasCheck = await validateAddonFreelancerPaidExtras(addonPicks);
  if (!paidExtrasCheck.ok) {
    return badRequest(paidExtrasCheck.error);
  }
  const addonRows =
    addonPicks.length > 0
      ? storedServiceChoicesFromAddonPicks(addonPicks)
      : await resolveInquiryAddonServiceChoices(body.addonServiceIds);
  const mergedServiceRows = [...enrichedServiceRows, ...addonRows];
  const serviceChoicesJson =
    mergedServiceRows.length > 0 ? JSON.stringify(mergedServiceRows) : null;
  const linkedSupplierIds = collectLinkedMarketplaceServiceIds(
    body.addonServiceIds,
    mergedServiceRows,
    body.serviceChoices
  );
  const supplierNameById = buildSupplierNameMap(mergedServiceRows);
  let outreachSupplierIds = filterSupplierIdsToLinked(
    parseSupplierServiceIds(body.supplierServiceIds),
    linkedSupplierIds
  );

  const parsedSupplierMessages = parseSupplierMessagesPayload(
    body.supplierMessages,
    linkedSupplierIds,
    supplierNameById
  );
  if (!parsedSupplierMessages.ok) {
    return badRequest(parsedSupplierMessages.error);
  }

  let storedSupplierMessages = parsedSupplierMessages.entries;
  if (
    body.supplierMessages != null &&
    outreachSupplierIds.length === 0 &&
    storedSupplierMessages.length > 0
  ) {
    outreachSupplierIds = storedSupplierMessages.map((e) => e.serviceId);
  }
  if (
    storedSupplierMessages.length === 0 &&
    supplierMessage &&
    outreachSupplierIds.length > 0
  ) {
    storedSupplierMessages = legacySingleSupplierMessageEntries(
      supplierMessage,
      outreachSupplierIds,
      supplierNameById
    );
  }

  const supplierMessagesJson = serializeStoredSupplierMessages(storedSupplierMessages);
  const messagesByServiceId = supplierMessagesMapFromStored(storedSupplierMessages);
  const legacySupplierMessage =
    storedSupplierMessages.length === 1 &&
    outreachSupplierIds.length === storedSupplierMessages.length
      ? storedSupplierMessages[0]?.message ?? null
      : supplierMessage && storedSupplierMessages.length === 0
        ? supplierMessage
        : null;

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
        supplierMessage: legacySupplierMessage,
        supplierMessagesJson,
        eventType,
        preferredDate,
        guestCount: guestCount != null && Number.isFinite(guestCount) ? guestCount : null,
        serviceChoicesJson,
        eventPackageId: eventPackageId ?? undefined,
        seekerBundleId: seekerBundleId ?? undefined,
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

  if (seekerBundleId != null) {
    await prisma.seekerEventBundle.updateMany({
      where: { id: seekerBundleId, userId: user.id },
      data: { status: "submitted" },
    });
  }

  let serviceRequestIds: number[] = [];
  if (outreachSupplierIds.length > 0) {
    serviceRequestIds = await createSupplierRequestsForInquiry({
      inquiryId: inquiry.id,
      userId: user.id,
      seekerName: user.name,
      venueName: venue.name,
      eventType,
      preferredDate,
      messagesByServiceId,
      supplierMessage: legacySupplierMessage,
      serviceIds: outreachSupplierIds,
    });
  }

  await bootstrapNegotiationForNewInquiry({
    inquiryId: inquiry.id,
    seekerUserId: user.id,
    venueOwnerId: venue.ownerId,
    venueId: venue.id,
    venueMessage: message,
    supplierMessage: legacySupplierMessage,
    messagesByServiceId,
    serviceRequestIds,
  });

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
