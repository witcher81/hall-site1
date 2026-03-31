import { type NextRequest, NextResponse } from "next/server";
import {
  buildEventPackageWhere,
  eventPackageOrderBy,
  parsePackagesSearchParams,
} from "@/lib/packagesFilter";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** רשימת חבילות מפורסמות (אולם + שירותים) — תומך ב־query כמו בעמוד /packages */
export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
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

  return NextResponse.json({ packages });
}
