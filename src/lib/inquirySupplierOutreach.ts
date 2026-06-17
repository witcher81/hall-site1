import "server-only";

import { createNotification } from "@/lib/notifications";
import { userWantsEmailFromDb } from "@/lib/emailNotifications";
import { buildSupplierRequestMessage } from "@/lib/serviceRequestMessageDisplay";
import { parseAddonServiceIds } from "@/lib/inquiryAddonFreelancers";
import { notifyFreelancerNewServiceRequest } from "@/lib/transactionalEmails";
import { prisma } from "@/lib/prisma";
import type { StoredServiceChoice } from "@/lib/venueInquiryAmenities";

function parseMarketplaceIdFromChoiceId(id: string): number | null {
  if (!id.startsWith("marketplace:")) return null;
  const n = Number(id.slice("marketplace:".length));
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** מזהי שירותים במאגר שקשורים לפנייה — חלופות, תוספות */
export function collectLinkedMarketplaceServiceIds(
  addonServiceIdsRaw: unknown,
  serviceRows: StoredServiceChoice[],
  rawServiceChoices: unknown
): number[] {
  const ids = new Set<number>();

  for (const id of parseAddonServiceIds(addonServiceIdsRaw)) {
    ids.add(id);
  }

  for (const row of serviceRows) {
    if (
      typeof row.marketplaceServiceId === "number" &&
      Number.isInteger(row.marketplaceServiceId) &&
      row.marketplaceServiceId > 0
    ) {
      ids.add(row.marketplaceServiceId);
    }
    const fromId = typeof row.id === "string" ? parseMarketplaceIdFromChoiceId(row.id) : null;
    if (fromId) ids.add(fromId);
  }

  if (Array.isArray(rawServiceChoices)) {
    for (const item of rawServiceChoices) {
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      const sid =
        typeof o.marketplaceServiceId === "number" &&
        Number.isInteger(o.marketplaceServiceId) &&
        o.marketplaceServiceId > 0
          ? o.marketplaceServiceId
          : null;
      if (sid) ids.add(sid);
      const id = typeof o.id === "string" ? parseMarketplaceIdFromChoiceId(o.id) : null;
      if (id) ids.add(id);
    }
  }

  return [...ids];
}

/** יוצר בקשות שירות לספקים שנבחרו בפנייה לאולם — מחזיר מזהי הבקשות שנוצרו */
export async function createSupplierRequestsForInquiry(input: {
  inquiryId: number;
  userId: number;
  seekerName: string | null;
  venueName: string;
  eventType: string | null;
  preferredDate: string | null;
  /** הודעה אחת לכל הספקים — legacy */
  supplierMessage?: string | null;
  /** הודעה לפי מזהה שירות */
  messagesByServiceId?: Map<number, string>;
  serviceIds: number[];
}): Promise<number[]> {
  if (input.serviceIds.length === 0) return [];

  const services = await prisma.service.findMany({
    where: { id: { in: input.serviceIds } },
    select: {
      id: true,
      name: true,
      providerId: true,
      provider: { select: { email: true, name: true, businessName: true } },
    },
  });

  const createdIds: number[] = [];

  for (const service of services) {
    const personalNote =
      input.messagesByServiceId?.get(service.id)?.trim() ||
      input.supplierMessage?.trim() ||
      null;
    const message = buildSupplierRequestMessage({
      supplierMessage: personalNote,
      venueName: input.venueName,
      eventType: input.eventType,
      preferredDate: input.preferredDate,
    });
    const request = await prisma.serviceRequest.create({
      data: {
        userId: input.userId,
        serviceId: service.id,
        inquiryId: input.inquiryId,
        message,
        eventType: input.eventType,
        preferredDate: input.preferredDate,
      },
    });
    createdIds.push(request.id);

    await createNotification({
      userId: service.providerId,
      type: "NEW_REQUEST",
      title: "בקשה חדשה לספק",
      body: `התקבלה בקשה דרך הזמנת אולם «${input.venueName}» עבור «${service.name}».`,
      href: `/dashboard/freelancer/requests?inquiryId=${input.inquiryId}`,
    });

    const providerEmail = service.provider.email;
    if (
      providerEmail &&
      (await userWantsEmailFromDb(service.providerId, "newServiceRequest"))
    ) {
      notifyFreelancerNewServiceRequest({
        providerEmail,
        providerName: service.provider.businessName ?? service.provider.name,
        serviceName: service.name,
        seekerName: input.seekerName,
      });
    }
  }

  return createdIds;
}
