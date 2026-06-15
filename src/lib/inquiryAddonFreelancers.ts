import "server-only";

import { prisma } from "@/lib/prisma";
import type { StoredServiceChoice } from "@/lib/venueInquiryAmenities";

export type InquiryAddonFreelancerPick = {
  serviceId: number;
  name: string;
  providerName: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
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
