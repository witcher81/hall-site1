import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_VALUE_SEPARATOR } from "@/lib/freelancerServiceCategories";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** רשימת שירותים לציבור (מחפשים) – עם סינון אופציונלי */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category")?.trim();
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const where: {
    OR?: Array<{ category: string } | { category: { startsWith: string } }>;
    minPrice?: { gte: number };
    maxPrice?: { lte: number };
  } = {};
  if (category && category.length > 0) {
    where.OR = [
      { category },
      { category: { startsWith: `${category}${CATEGORY_VALUE_SEPARATOR}` } },
    ];
  }
  if (minPrice && minPrice !== "") {
    const n = Number(minPrice);
    if (!Number.isNaN(n)) where.minPrice = { gte: n };
  }
  if (maxPrice && maxPrice !== "") {
    const n = Number(maxPrice);
    if (!Number.isNaN(n)) where.maxPrice = { lte: n };
  }

  const services = await prisma.service.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          businessName: true,
          businessPhone: true,
          socialLinksJson: true,
        },
      },
    },
  });

  return NextResponse.json({ services });
}
