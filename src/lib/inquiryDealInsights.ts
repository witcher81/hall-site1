import type { PrismaClient } from "@prisma/client";
import { buildMarketplaceServiceWhere } from "@/lib/marketplaceServiceSearch";
import {
  scoreMarketplaceCandidates,
  scoredToDealServiceRow,
  type MarketplaceRecommendation,
} from "@/lib/marketplaceValueScore";
import type { InquiryMarketplaceSearch } from "@/lib/venueInquiryFreelancerMatch";

export type InquiryDealServiceRow = {
  id: number;
  name: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  provider: {
    id: number;
    name: string | null;
    businessName: string | null;
  };
  rating?: number;
  reviewCount?: number;
  ratingIsEstimated?: boolean;
  valueScore?: number;
  valueBadge?: "best_value" | "cheapest" | "top_rated" | null;
  compareNote?: string | null;
};

export type InquiryDealInsight = {
  available: boolean;
  totalCount: number;
  browseCategory: string;
  marketFrom: number | null;
  hallPrice: number | null;
  savingsAmount: number | null;
  cheaperThanHall: boolean;
  recommendExternal: boolean;
  topServices: InquiryDealServiceRow[];
  recommendation: MarketplaceRecommendation | null;
};

const candidateSelect = {
  id: true,
  name: true,
  category: true,
  minPrice: true,
  maxPrice: true,
  experienceYears: true,
  includesTravel: true,
  includesEquipment: true,
  provider: {
    select: { id: true, name: true, businessName: true },
  },
  reviews: { select: { rating: true } },
  _count: { select: { serviceRequests: true } },
} as const;

const CANDIDATE_POOL = 24;

export async function queryInquiryDealInsight(
  prisma: PrismaClient,
  search: InquiryMarketplaceSearch,
  hallPrice: number | null,
  listLimit = 3
): Promise<InquiryDealInsight> {
  const baseWhere = buildMarketplaceServiceWhere(search.categories, search.keywords);
  const hallPriceValid = hallPrice != null && hallPrice > 0;

  const [totalCount, candidates] = await Promise.all([
    prisma.service.count({ where: baseWhere }),
    prisma.service.findMany({
      where: { AND: [baseWhere, { minPrice: { not: null, gt: 0 } }] },
      orderBy: [{ minPrice: "asc" }, { createdAt: "desc" }],
      take: CANDIDATE_POOL,
      select: candidateSelect,
    }),
  ]);

  const marketFrom = candidates.length > 0 ? candidates[0].minPrice : null;
  const cheaperThanHall =
    hallPriceValid &&
    marketFrom != null &&
    marketFrom > 0 &&
    marketFrom < (hallPrice as number);

  const savingsAmount =
    cheaperThanHall && marketFrom != null && hallPriceValid
      ? (hallPrice as number) - marketFrom
      : null;

  const { offers, recommendation } = scoreMarketplaceCandidates(
    candidates.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      minPrice: c.minPrice,
      maxPrice: c.maxPrice,
      experienceYears: c.experienceYears,
      includesTravel: c.includesTravel,
      includesEquipment: c.includesEquipment,
      requestCount: c._count.serviceRequests,
      reviews: c.reviews,
      provider: c.provider,
    })),
    { hallPrice: hallPriceValid ? hallPrice : null, displayLimit: listLimit }
  );

  const topServices = offers.map(scoredToDealServiceRow);

  return {
    available: totalCount > 0,
    totalCount,
    browseCategory: search.browseCategory,
    marketFrom,
    hallPrice: hallPriceValid ? hallPrice : null,
    savingsAmount,
    cheaperThanHall,
    recommendExternal: cheaperThanHall || offers.length > 0,
    topServices,
    recommendation,
  };
}

export function aggregateDealSavings(
  byId: Record<string, Pick<InquiryDealInsight, "cheaperThanHall" | "savingsAmount">>
): { itemCount: number; totalSavings: number } {
  let itemCount = 0;
  let totalSavings = 0;
  for (const row of Object.values(byId)) {
    if (!row.cheaperThanHall || row.savingsAmount == null || row.savingsAmount <= 0) continue;
    itemCount += 1;
    totalSavings += row.savingsAmount;
  }
  return { itemCount, totalSavings };
}
