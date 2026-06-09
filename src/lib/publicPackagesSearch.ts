import "server-only";

import {
  buildEventPackageWhere,
  eventPackageOrderBy,
  parsePackagesSearchParams,
} from "@/lib/packagesFilter";
import { prisma } from "@/lib/prisma";

export type PublicPackageListItem = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  bundlePriceFrom: number | null;
  bundlePriceTo: number | null;
  badgeLabel: string | null;
  venue: {
    id: number;
    name: string;
    city: string;
    coverImageUrl: string | null;
    minGuests: number | null;
    maxGuests: number | null;
  };
  services: {
    service: {
      id: number;
      name: string;
      category: string | null;
      coverImageUrl: string | null;
    };
  }[];
};

export async function searchPublicPackages(
  searchParams: URLSearchParams
): Promise<{ packages: PublicPackageListItem[] }> {
  const raw = Object.fromEntries(searchParams.entries());
  const input = parsePackagesSearchParams(raw);
  const where = buildEventPackageWhere(input);
  const orderBy = eventPackageOrderBy(input.sort);

  const packages = await prisma.eventPackage.findMany({
    where,
    orderBy,
    select: {
      id: true,
      title: true,
      subtitle: true,
      description: true,
      bundlePriceFrom: true,
      bundlePriceTo: true,
      badgeLabel: true,
      venue: {
        select: {
          id: true,
          name: true,
          city: true,
          coverImageUrl: true,
          minGuests: true,
          maxGuests: true,
        },
      },
      services: {
        select: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              coverImageUrl: true,
            },
          },
        },
      },
    },
  });

  return { packages };
}
