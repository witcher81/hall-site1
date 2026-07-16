import { prisma } from "@/lib/prisma";
import { approvedListingWhere } from "@/lib/listingModerationTypes";
import {
  buildServiceCategoryAvailabilityFromCategories,
  type SearchAvailabilityPayload,
  type ServiceCategoryAvailability,
} from "@/lib/searchAvailabilityPure";

export type {
  SearchAvailabilityPayload,
  ServiceCategoryAvailability,
} from "@/lib/searchAvailabilityPure";

export {
  buildServiceCategoryAvailabilityFromCategories,
  isCityAvailable,
  isPrimaryAvailable,
  isSecondaryAvailable,
} from "@/lib/searchAvailabilityPure";

export async function getApprovedVenueCities(): Promise<string[]> {
  const rows = await prisma.venue.findMany({
    where: approvedListingWhere(),
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return rows
    .map((r) => r.city.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "he"));
}

export async function getApprovedServiceCategoryAvailability(): Promise<ServiceCategoryAvailability> {
  const rows = await prisma.service.findMany({
    where: {
      ...approvedListingWhere(),
      category: { not: null },
    },
    select: { category: true },
  });
  const categories = rows
    .map((r) => r.category?.trim() ?? "")
    .filter(Boolean);
  return buildServiceCategoryAvailabilityFromCategories(categories);
}

export async function getSearchAvailability(): Promise<SearchAvailabilityPayload> {
  const [cities, serviceAvail] = await Promise.all([
    getApprovedVenueCities(),
    getApprovedServiceCategoryAvailability(),
  ]);
  return {
    cities,
    primaries: serviceAvail.primaries,
    secondariesByPrimary: serviceAvail.secondariesByPrimary,
  };
}
