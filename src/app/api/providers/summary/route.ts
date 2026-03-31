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

/** פרטי ספקים (פרילאנסרים) לפי מזהים — לבר «נצפו לאחרונה» */
export async function GET(req: NextRequest) {
  const ids = parseIds(req.nextUrl.searchParams.get("ids"));
  if (ids.length === 0) {
    return NextResponse.json({ providers: [] });
  }

  try {
    const rows = await prisma.user.findMany({
      where: { id: { in: ids }, role: "FREELANCER" },
      select: {
        id: true,
        name: true,
        businessName: true,
        services: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { coverImageUrl: true, name: true, category: true },
        },
      },
    });
    const order = new Map(ids.map((id, i) => [id, i]));
    rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return NextResponse.json({ providers: rows });
  } catch (e) {
    console.error("providers/summary:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
