import { NextRequest, NextResponse } from "next/server";
import { queryInquiryDealInsight } from "@/lib/inquiryDealInsights";
import { isSameOriginApiRequest } from "@/lib/sameOriginGuard";
import { getInquiryMarketplaceSearch } from "@/lib/venueInquiryFreelancerMatch";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type DealInsightItem = {
  id: string;
  label: string;
  hallPrice?: number | null;
};

const MAX_ITEMS = 12;

/** השוואת מחיר מרוכזת: אולם מול מאגר ספקים לכל פריטי ההזמנה */
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

  const listLimitRaw = (body as { listLimit?: unknown }).listLimit;
  const listLimit =
    typeof listLimitRaw === "number" && listLimitRaw > 0
      ? Math.min(8, Math.max(1, listLimitRaw))
      : 4;

  const byId: Record<string, Awaited<ReturnType<typeof queryInquiryDealInsight>>> = {};

  await Promise.all(
    items.map(async (raw) => {
      if (typeof raw !== "object" || raw === null) return;
      const o = raw as DealInsightItem;
      const id = typeof o.id === "string" ? o.id : "";
      const label = typeof o.label === "string" ? o.label : "";
      if (!id) return;

      const search = getInquiryMarketplaceSearch({ id, label });
      if (!search) {
        byId[id] = {
          available: false,
          totalCount: 0,
          browseCategory: "",
          marketFrom: null,
          hallPrice: null,
          savingsAmount: null,
          cheaperThanHall: false,
          recommendExternal: false,
          topServices: [],
          recommendation: null,
        };
        return;
      }

      const hpRaw = o.hallPrice;
      const hallPrice =
        typeof hpRaw === "number" && Number.isFinite(hpRaw) && hpRaw > 0 ? hpRaw : null;

      byId[id] = await queryInquiryDealInsight(prisma, search, hallPrice, listLimit);
    })
  );

  return NextResponse.json({ byId });
}
