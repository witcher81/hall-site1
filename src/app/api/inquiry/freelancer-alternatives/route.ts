import { NextRequest, NextResponse } from "next/server";
import { queryInquiryDealInsight } from "@/lib/inquiryDealInsights";
import { isSameOriginApiRequest } from "@/lib/sameOriginGuard";
import { resolveProviderCategoryFilter } from "@/lib/serviceCategoryQuery";
import { getInquiryMarketplaceSearch } from "@/lib/venueInquiryFreelancerMatch";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** שירותי פרילנסרים להשוואה מול תוספת באולם */
export async function GET(req: NextRequest) {
  if (!isSameOriginApiRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
        ? (() => {
            const { primary } = resolveProviderCategoryFilter(categoryLegacy);
            return primary
              ? {
                  categories: [primary],
                  keywords: [] as string[],
                  browseCategory: primary,
                }
              : null;
          })()
        : null;

  if (!search || search.categories.length + search.keywords.length === 0) {
    return NextResponse.json({ error: "לא ניתן למפות לקטגוריית ספקים" }, { status: 400 });
  }

  const hallPrice =
    hallPriceRaw && hallPriceRaw !== "" ? Number(hallPriceRaw) : NaN;
  const hallPriceValid = Number.isFinite(hallPrice) && hallPrice > 0;

  const limitParsed = limitRaw && limitRaw !== "" ? Number(limitRaw) : 4;
  const limit = Number.isFinite(limitParsed)
    ? Math.min(8, Math.max(1, Math.floor(limitParsed)))
    : 4;

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
