import "server-only";

import { prisma } from "@/lib/prisma";
import { parseServiceIncludesBundle } from "@/lib/serviceIncludes";
import type { StoredServiceChoice } from "@/lib/venueInquiryAmenities";

export type InquiryAddonPaidExtraPick = {
  label: string;
  description?: string;
  exactPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
};

export type InquiryAddonFreelancerPick = {
  serviceId: number;
  name: string;
  providerName: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  /** תוספות בתשלום שנבחרו מהספק */
  selectedPaidExtras?: InquiryAddonPaidExtraPick[];
};

const MAX_ADDON_SERVICES = 20;

export function parseAddonServiceIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const ids: number[] = [];
  for (const item of raw) {
    const n = typeof item === "number" ? item : Number(item);
    if (!Number.isInteger(n) || n <= 0 || ids.includes(n)) continue;
    ids.push(n);
    if (ids.length >= MAX_ADDON_SERVICES) break;
  }
  return ids;
}

export function storedServiceChoicesFromAddonPicks(
  picks: InquiryAddonFreelancerPick[]
): StoredServiceChoice[] {
  return picks.map((p) => ({
    id: `marketplace:${p.serviceId}`,
    label: p.name.trim() || "שירות במאגר",
    source: "external" as const,
    priceMode: "extra" as const,
    extraPrice: p.minPrice,
    extraPriceMax:
      p.maxPrice != null && p.minPrice != null && p.maxPrice > p.minPrice
        ? p.maxPrice
        : p.maxPrice ?? null,
    marketplaceServiceId: p.serviceId,
    replacementName: p.name,
    replacementProvider: p.providerName,
    ...(p.selectedPaidExtras?.length
      ? { paidExtrasSelected: p.selectedPaidExtras }
      : {}),
  }));
}

export async function resolveInquiryAddonServiceChoices(
  raw: unknown
): Promise<StoredServiceChoice[]> {
  const ids = parseAddonServiceIds(raw);
  if (ids.length === 0) return [];

  const services = await prisma.service.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      minPrice: true,
      maxPrice: true,
      provider: {
        select: { name: true, businessName: true },
      },
    },
  });

  const byId = new Map(services.map((s) => [s.id, s]));

  return ids
    .map((id) => byId.get(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({
      id: `marketplace:${s.id}`,
      label: s.name.trim() || "שירות במאגר",
      source: "external" as const,
      priceMode: "extra" as const,
      extraPrice: s.minPrice,
      extraPriceMax:
        s.maxPrice != null && s.minPrice != null && s.maxPrice > s.minPrice
          ? s.maxPrice
          : s.maxPrice ?? null,
    }));
}

/** מאמת תוספות בתשלום שנבחרו מול מה שהספק הגדיר בשירות */
export async function validateAddonFreelancerPaidExtras(
  picks: InquiryAddonFreelancerPick[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const withExtras = picks.filter((p) => p.selectedPaidExtras?.length);
  if (withExtras.length === 0) return { ok: true };

  const services = await prisma.service.findMany({
    where: { id: { in: withExtras.map((p) => p.serviceId) } },
    select: { id: true, name: true, customIncludesJson: true },
  });
  const byId = new Map(services.map((s) => [s.id, s]));

  for (const pick of withExtras) {
    const service = byId.get(pick.serviceId);
    if (!service) {
      return { ok: false, error: "אחד מהשירותים שנבחרו לא נמצא" };
    }
    const allowedLabels = new Set(
      parseServiceIncludesBundle(service.customIncludesJson).paidExtras.map((e) =>
        e.label.trim()
      )
    );
    for (const extra of pick.selectedPaidExtras ?? []) {
      if (!allowedLabels.has(extra.label.trim())) {
        return {
          ok: false,
          error: `תוספת «${extra.label}» אינה זמינה לשירות «${service.name}»`,
        };
      }
    }
  }

  return { ok: true };
}
