import "server-only";

import { buildServiceCategoryWhere } from "@/lib/serviceCategoryQuery";
import { prisma } from "@/lib/prisma";
import {
  parseServiceIncludesBundle,
  type ServicePaidExtraItem,
} from "@/lib/serviceIncludes";
import { USER_INPUT_MAX } from "@/lib/userInputValidation";

/** תקרת תוצאות לחיפוש פומבי — מונע טעינת כל הטבלה לזיכרון (DoS) */
const MAX_PUBLIC_PROVIDER_RESULTS = 500;

export type PublicProviderServiceItem = {
  id: number;
  name: string;
  category: string | null;
  shortDescription: string | null;
  description: string | null;
  serviceArea: string | null;
  experienceYears: number | null;
  languages: string | null;
  coverImageUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  providerId: number;
  paidExtras: ServicePaidExtraItem[];
  provider: {
    id: number;
    name: string | null;
    businessName: string | null;
    businessPhone: string | null;
    socialLinksJson: string | null;
  };
};

export async function searchPublicProviders(
  searchParams: URLSearchParams
): Promise<{ services: PublicProviderServiceItem[] }> {
  const category = searchParams.get("category")?.trim() ?? "";
  const secondary = searchParams.get("secondary")?.trim() ?? "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const where: {
    OR?: Array<{ category: string } | { category: { startsWith: string } }>;
    minPrice?: { gte: number };
    maxPrice?: { lte: number };
  } = {
    ...buildServiceCategoryWhere(category, secondary),
  };
  if (minPrice && minPrice !== "") {
    const n = Number(minPrice);
    if (Number.isFinite(n) && n >= 0) {
      where.minPrice = { gte: Math.min(n, USER_INPUT_MAX.PRICE_MAX) };
    }
  }
  if (maxPrice && maxPrice !== "") {
    const n = Number(maxPrice);
    if (Number.isFinite(n) && n >= 0) {
      where.maxPrice = { lte: Math.min(n, USER_INPUT_MAX.PRICE_MAX) };
    }
  }

  const services = await prisma.service.findMany({
    where,
    take: MAX_PUBLIC_PROVIDER_RESULTS,
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

  return {
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      shortDescription: s.shortDescription,
      description: s.description,
      serviceArea: s.serviceArea,
      experienceYears: s.experienceYears,
      languages: s.languages,
      coverImageUrl: s.coverImageUrl,
      minPrice: s.minPrice,
      maxPrice: s.maxPrice,
      providerId: s.providerId,
      paidExtras: parseServiceIncludesBundle(s.customIncludesJson).paidExtras,
      provider: s.provider,
    })),
  };
}
