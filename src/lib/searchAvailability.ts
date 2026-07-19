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

const AVAILABILITY_CACHE_TTL_MS = 60_000;

let venueCitiesCache: { at: number; data: string[] } | null = null;
let serviceCategoryCache: {
  at: number;
  data: ServiceCategoryAvailability;
} | null = null;

export async function getApprovedVenueCities(): Promise<string[]> {
  const cached = venueCitiesCache;
  if (cached && Date.now() - cached.at < AVAILABILITY_CACHE_TTL_MS) {
    return cached.data;
  }
  const rows = await prisma.venue.findMany({
    where: approvedListingWhere(),
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  const data = rows
    .map((r) => r.city.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "he"));
  venueCitiesCache = { at: Date.now(), data };
  return data;
}

export async function getApprovedServiceCategoryAvailability(): Promise<ServiceCategoryAvailability> {
  const cached = serviceCategoryCache;
  if (cached && Date.now() - cached.at < AVAILABILITY_CACHE_TTL_MS) {
    return cached.data;
  }
  const rows = await prisma.service.findMany({
    where: {
      ...approvedListingWhere(),
      category: { not: null },
    },
    select: { category: true },
    distinct: ["category"],
  });
  const categories = rows
    .map((r) => r.category?.trim() ?? "")
    .filter(Boolean);
  const data = buildServiceCategoryAvailabilityFromCategories(categories);
  serviceCategoryCache = { at: Date.now(), data };
  return data;
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
