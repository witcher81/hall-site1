import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { approvedListingWhere } from "@/lib/listingModerationTypes";

export const runtime = "nodejs";

const MAX_IDS = 24;

function parseIds(param: string | null): number[] {
  if (!param?.trim()) return [];
  const ids: number[] = [];
  for (const part of param.split(",")) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n > 0 && !ids.includes(n)) ids.push(n);
    if (ids.length >= MAX_IDS) break;
  }
  return ids;
}

/** פרטי שירותים לפי מזהים (בניית חבילה, וכו') */
export async function GET(req: NextRequest) {
  const ids = parseIds(req.nextUrl.searchParams.get("ids"));
  if (ids.length === 0) {
    return NextResponse.json({ services: [] });
  }

  try {
    const services = await prisma.service.findMany({
      where: { id: { in: ids }, ...approvedListingWhere() },
      select: {
        id: true,
        name: true,
        category: true,
        minPrice: true,
        maxPrice: true,
        coverImageUrl: true,
      },
    });
    const order = new Map(ids.map((id, i) => [id, i]));
    services.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return NextResponse.json({ services });
  } catch (e) {
    console.error("services/summary:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
