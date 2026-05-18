import { NextRequest, NextResponse } from "next/server";
import { buildMarketplaceServiceWhere } from "@/lib/marketplaceServiceSearch";
import { getInquiryMarketplaceSearch } from "@/lib/venueInquiryFreelancerMatch";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** שירותי פרילנסרים להשוואה מול תוספת באולם */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId")?.trim() ?? "";
  const label = searchParams.get("label")?.trim() ?? "";
  const categoryLegacy = searchParams.get("category")?.trim() ?? "";
  const hallPriceRaw = searchParams.get("hallPrice");
  const limitRaw = searchParams.get("limit");

  const search =
    serviceId || label
      ? getInquiryMarketplaceSearch({ id: serviceId, label })
      : categoryLegacy
        ? {
            categories: [categoryLegacy],
            keywords: [] as string[],
            browseCategory: categoryLegacy,
          }
        : null;

  if (!search || search.categories.length + search.keywords.length === 0) {
    return NextResponse.json({ error: "לא ניתן למפות לקטגוריית ספקים" }, { status: 400 });
  }

  const hallPrice =
    hallPriceRaw && hallPriceRaw !== "" ? Number(hallPriceRaw) : NaN;
  const hallPriceValid = Number.isFinite(hallPrice) && hallPrice > 0;

  const limit = Math.min(
    8,
    Math.max(1, limitRaw && limitRaw !== "" ? Number(limitRaw) : 4)
  );

  const baseWhere = buildMarketplaceServiceWhere(search.categories, search.keywords);

  const marketRow = await prisma.service.findFirst({
    where: {
      ...baseWhere,
      minPrice: { not: null, gt: 0 },
    },
    orderBy: { minPrice: "asc" },
    select: { minPrice: true },
  });
  const marketFrom = marketRow?.minPrice ?? null;

  const totalCount = await prisma.service.count({ where: baseWhere });

  const listWhere = hallPriceValid
    ? {
        AND: [
          baseWhere,
          { minPrice: { not: null, gt: 0, lt: hallPrice } },
        ],
      }
    : {
        AND: [baseWhere, { minPrice: { not: null, gt: 0 } }],
      };

  const services = await prisma.service.findMany({
    where: listWhere,
    orderBy: [{ minPrice: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      category: true,
      minPrice: true,
      maxPrice: true,
      coverImageUrl: true,
      provider: {
        select: {
          id: true,
          name: true,
          businessName: true,
        },
      },
    },
  });

  const cheaperThanHall =
    hallPriceValid && marketFrom != null && marketFrom > 0 && marketFrom < hallPrice;

  return NextResponse.json({
    available: totalCount > 0,
    totalCount,
    browseCategory: search.browseCategory,
    categories: search.categories,
    marketFrom,
    hallPrice: hallPriceValid ? hallPrice : null,
    cheaperThanHall,
    services,
  });
}
