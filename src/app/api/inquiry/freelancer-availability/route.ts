import { NextRequest, NextResponse } from "next/server";
import { buildMarketplaceServiceWhere } from "@/lib/marketplaceServiceSearch";
import { isSameOriginApiRequest } from "@/lib/sameOriginGuard";
import { getInquiryMarketplaceSearch } from "@/lib/venueInquiryFreelancerMatch";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AvailabilityItem = { id: string; label: string };

const MAX_ITEMS = 12;

/** בדיקה אם יש בכלל ספקים במאגר לפריטי הזמנה (לפני הצגת «ספק חיצוני») */
export async function POST(req: NextRequest) {
  if (!isSameOriginApiRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 });
  }

  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "חסר מערך items" }, { status: 400 });
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `ניתן לשלוח עד ${MAX_ITEMS} פריטים בבקשה אחת` },
      { status: 400 }
    );
  }

  const byId: Record<
    string,
    { available: boolean; totalCount: number; browseCategory: string | null }
  > = {};

  for (const raw of items) {
    if (typeof raw !== "object" || raw === null) continue;
    const o = raw as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : "";
    const label = typeof o.label === "string" ? o.label : "";
    if (!id) continue;

    const search = getInquiryMarketplaceSearch({ id, label });
    if (!search) {
      byId[id] = { available: false, totalCount: 0, browseCategory: null };
      continue;
    }

    const where = buildMarketplaceServiceWhere(search.categories, search.keywords);
    const totalCount = await prisma.service.count({ where });
    byId[id] = {
      available: totalCount > 0,
      totalCount,
      browseCategory: search.browseCategory,
    };
  }

  return NextResponse.json({ byId });
}
