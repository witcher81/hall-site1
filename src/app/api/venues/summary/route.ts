import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_IDS = 48;

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

/** פרטי אולמות לפי מזהים (לעמוד "נצפו לאחרונה") — סדר התוצאה תואם לסדר הבקשה */
export async function GET(req: NextRequest) {
  const ids = parseIds(req.nextUrl.searchParams.get("ids"));
  if (ids.length === 0) {
    return NextResponse.json({ venues: [] });
  }

  try {
    const venues = await prisma.venue.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        coverImageUrl: true,
        minPrice: true,
        maxPrice: true,
        minGuests: true,
        maxGuests: true,
      },
    });
    const order = new Map(ids.map((id, i) => [id, i]));
    venues.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return NextResponse.json({ venues });
  } catch (e) {
    console.error("venues/summary:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
