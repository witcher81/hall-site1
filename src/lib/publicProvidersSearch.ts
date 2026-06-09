import "server-only";

import { buildServiceCategoryWhere } from "@/lib/serviceCategoryQuery";
import { prisma } from "@/lib/prisma";

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

  return { services };
}
