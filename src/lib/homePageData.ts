import "server-only";

import { prisma } from "@/lib/prisma";
import { isBoostActive } from "@/lib/listingBoost";
import { approvedListingWhere } from "@/lib/listingModerationTypes";
import {
  resolveServiceRating,
  type MarketplaceCandidateInput,
} from "@/lib/marketplaceValueScore";
import { parseServiceCategoryValue } from "@/lib/freelancerServiceCategories";

export type HomeFeaturedVenue = {
  id: number;
  name: string;
  city: string;
  imageUrl: string | null;
  priceLabel: string | null;
  isBoosted: boolean;
  boutique: boolean;
};

export type HomeTopService = {
  id: number;
  name: string;
  categoryLabel: string;
  imageUrl: string | null;
  priceLabel: string | null;
  rating: number;
  reviewCount: number;
  ratingIsEstimated: boolean;
  providerName: string;
  providerId: number;
  isBoosted: boolean;
};

function firstGalleryUrl(galleryImageUrls: string | null): string | null {
  if (!galleryImageUrls) return null;
  try {
    const arr = JSON.parse(galleryImageUrls) as unknown;
    if (Array.isArray(arr) && typeof arr[0] === "string" && arr[0].trim()) {
      return arr[0].trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function formatVenuePriceLabel(v: {
  hallRentalMin: number | null;
  hallRentalMax: number | null;
  minPrice: number | null;
  maxPrice: number | null;
}): string | null {
  const lo = v.hallRentalMin ?? v.minPrice;
  const hi = v.hallRentalMax ?? v.maxPrice;
  if (lo == null && hi == null) return null;
  if (lo != null && hi != null && lo === hi) return `החל מ־₪${lo.toLocaleString("he-IL")}`;
  if (lo != null && hi == null) return `החל מ־₪${lo.toLocaleString("he-IL")}`;
  if (lo == null && hi != null) return `עד ₪${hi.toLocaleString("he-IL")}`;
  return `₪${lo!.toLocaleString("he-IL")}–${hi!.toLocaleString("he-IL")}`;
}

function formatServicePriceLabel(
  minPrice: number | null,
  maxPrice: number | null
): string | null {
  if (minPrice == null && maxPrice == null) return null;
  if (minPrice != null && maxPrice != null && minPrice === maxPrice) {
    return `החל מ־₪${minPrice.toLocaleString("he-IL")}`;
  }
  if (minPrice != null) {
    return `החל מ־₪${minPrice.toLocaleString("he-IL")}`;
  }
  return `עד ₪${maxPrice!.toLocaleString("he-IL")}`;
}

function categoryDisplayLabel(category: string | null): string {
  if (!category?.trim()) return "ספק שירותים";
  const parsed = parseServiceCategoryValue(category);
  return parsed.secondary || parsed.primary || category;
}

export async function getHomeFeaturedVenues(
  limit = 6
): Promise<HomeFeaturedVenue[]> {
  const now = new Date();
  const rows = await prisma.venue.findMany({
    where: approvedListingWhere(),
    take: Math.max(limit * 4, 24),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      city: true,
      coverImageUrl: true,
      galleryImageUrls: true,
      hallRentalMin: true,
      hallRentalMax: true,
      minPrice: true,
      maxPrice: true,
      boutique: true,
      boostExpiresAt: true,
    },
  });

  const sorted = [...rows].sort((a, b) => {
    const ab = isBoostActive(a.boostExpiresAt, now);
    const bb = isBoostActive(b.boostExpiresAt, now);
    if (ab !== bb) return ab ? -1 : 1;
    return 0;
  });

  return sorted.slice(0, limit).map((v) => ({
    id: v.id,
    name: v.name,
    city: v.city,
    imageUrl: v.coverImageUrl ?? firstGalleryUrl(v.galleryImageUrls),
    priceLabel: formatVenuePriceLabel(v),
    isBoosted: isBoostActive(v.boostExpiresAt, now),
    boutique: Boolean(v.boutique),
  }));
}

export async function getHomeTopServices(limit = 8): Promise<HomeTopService[]> {
  const now = new Date();
  const rows = await prisma.service.findMany({
    where: approvedListingWhere(),
    take: 60,
    orderBy: { createdAt: "desc" },
    include: {
      provider: {
        select: { id: true, name: true, businessName: true },
      },
      reviews: { select: { rating: true } },
      _count: { select: { serviceRequests: true } },
    },
  });

  const scored = rows.map((s) => {
    const input: MarketplaceCandidateInput = {
      id: s.id,
      name: s.name,
      category: s.category,
      minPrice: s.minPrice,
      maxPrice: s.maxPrice,
      experienceYears: s.experienceYears,
      includesTravel: s.includesTravel,
      includesEquipment: s.includesEquipment,
      requestCount: s._count.serviceRequests,
      reviews: s.reviews,
      provider: s.provider,
    };
    const { rating, reviewCount, ratingIsEstimated } =
      resolveServiceRating(input);
    return {
      id: s.id,
      name: s.name,
      categoryLabel: categoryDisplayLabel(s.category),
      imageUrl: s.coverImageUrl ?? firstGalleryUrl(s.galleryImageUrls),
      priceLabel: formatServicePriceLabel(s.minPrice, s.maxPrice),
      rating,
      reviewCount,
      ratingIsEstimated,
      providerName:
        s.provider.businessName?.trim() ||
        s.provider.name?.trim() ||
        "ספק",
      providerId: s.provider.id,
      isBoosted: isBoostActive(s.boostExpiresAt, now),
      sortScore: rating * 10 + reviewCount + (s.coverImageUrl ? 2 : 0),
    };
  });

  scored.sort((a, b) => {
    if (a.isBoosted !== b.isBoosted) return a.isBoosted ? -1 : 1;
    return b.sortScore - a.sortScore;
  });

  return scored.slice(0, limit).map(({ sortScore: _s, ...rest }) => rest);
}
