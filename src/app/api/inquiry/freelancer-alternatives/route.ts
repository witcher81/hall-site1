import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_VALUE_SEPARATOR } from "@/lib/freelancerServiceCategories";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** שירותי פרילנסרים בקטגוריה — להשוואה מול תוספת באולם */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category")?.trim();
  const hallPriceRaw = searchParams.get("hallPrice");
  const limitRaw = searchParams.get("limit");

  if (!category) {
    return NextResponse.json({ error: "חסרה קטגוריה" }, { status: 400 });
  }

  const hallPrice =
    hallPriceRaw && hallPriceRaw !== "" ? Number(hallPriceRaw) : NaN;
  const hallPriceValid = Number.isFinite(hallPrice) && hallPrice > 0;

  const limit = Math.min(
    8,
    Math.max(1, limitRaw && limitRaw !== "" ? Number(limitRaw) : 4)
  );

  const categoryWhere = {
    OR: [
      { category },
      { category: { startsWith: `${category}${CATEGORY_VALUE_SEPARATOR}` } },
    ],
  };

  const marketRow = await prisma.service.findFirst({
    where: {
      ...categoryWhere,
      minPrice: { not: null, gt: 0 },
    },
    orderBy: { minPrice: "asc" },
    select: { minPrice: true },
  });
  const marketFrom = marketRow?.minPrice ?? null;

  const cheaperWhere = hallPriceValid
    ? {
        ...categoryWhere,
        minPrice: { not: null, gt: 0, lt: hallPrice },
      }
    : {
        ...categoryWhere,
        minPrice: { not: null, gt: 0 },
      };

  const services = await prisma.service.findMany({
    where: cheaperWhere,
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
    category,
    marketFrom,
    hallPrice: hallPriceValid ? hallPrice : null,
    cheaperThanHall,
    services,
  });
}
