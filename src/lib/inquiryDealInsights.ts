import type { PrismaClient } from "@prisma/client";
import { buildMarketplaceServiceWhere } from "@/lib/marketplaceServiceSearch";
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
};

export type InquiryDealInsight = {
  available: boolean;
  totalCount: number;
  browseCategory: string;
  marketFrom: number | null;
  hallPrice: number | null;
  /** hallPrice − marketFrom when market is cheaper */
  savingsAmount: number | null;
  cheaperThanHall: boolean;
  /** יש מחיר במאגר נמוך מתוספת האולם */
  recommendExternal: boolean;
  topServices: InquiryDealServiceRow[];
};

export async function queryInquiryDealInsight(
  prisma: PrismaClient,
  search: InquiryMarketplaceSearch,
  hallPrice: number | null,
  listLimit = 4
): Promise<InquiryDealInsight> {
  const baseWhere = buildMarketplaceServiceWhere(search.categories, search.keywords);
  const hallPriceValid = hallPrice != null && hallPrice > 0;

  const [marketRow, totalCount] = await Promise.all([
    prisma.service.findFirst({
      where: { ...baseWhere, minPrice: { not: null, gt: 0 } },
      orderBy: { minPrice: "asc" },
      select: { minPrice: true },
    }),
    prisma.service.count({ where: baseWhere }),
  ]);

  const marketFrom = marketRow?.minPrice ?? null;
  const cheaperThanHall =
    hallPriceValid &&
    marketFrom != null &&
    marketFrom > 0 &&
    marketFrom < (hallPrice as number);

  const savingsAmount =
    cheaperThanHall && marketFrom != null && hallPriceValid
      ? (hallPrice as number) - marketFrom
      : null;

  const listWhere = hallPriceValid
    ? {
        AND: [baseWhere, { minPrice: { not: null, gt: 0, lt: hallPrice as number } }],
      }
    : { AND: [baseWhere, { minPrice: { not: null, gt: 0 } }] };

  const topServices = await prisma.service.findMany({
    where: listWhere,
    orderBy: [{ minPrice: "asc" }, { createdAt: "desc" }],
    take: listLimit,
    select: {
      id: true,
      name: true,
      category: true,
      minPrice: true,
      maxPrice: true,
      provider: {
        select: { id: true, name: true, businessName: true },
      },
    },
  });

  return {
    available: totalCount > 0,
    totalCount,
    browseCategory: search.browseCategory,
    marketFrom,
    hallPrice: hallPriceValid ? hallPrice : null,
    savingsAmount,
    cheaperThanHall,
    recommendExternal: cheaperThanHall,
    topServices,
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
