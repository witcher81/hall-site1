import { NextRequest, NextResponse } from "next/server";
import { queryInquiryDealInsight } from "@/lib/inquiryDealInsights";
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

  const insight = await queryInquiryDealInsight(
    prisma,
    search,
    hallPriceValid ? hallPrice : null,
    limit
  );

  return NextResponse.json({
    available: insight.available,
    totalCount: insight.totalCount,
    browseCategory: insight.browseCategory,
    categories: search.categories,
    marketFrom: insight.marketFrom,
    hallPrice: insight.hallPrice,
    cheaperThanHall: insight.cheaperThanHall,
    services: insight.topServices,
    recommendation: insight.recommendation,
  });
}
