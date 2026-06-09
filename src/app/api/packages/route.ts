import { type NextRequest, NextResponse } from "next/server";
import { searchPublicPackages } from "@/lib/publicPackagesSearch";

export const runtime = "nodejs";

/** רשימת חבילות מפורסמות (אולם + שירותים) — תומך ב־query כמו בעמוד /packages */
export async function GET(req: NextRequest) {
  const { packages } = await searchPublicPackages(req.nextUrl.searchParams);
  return NextResponse.json({ packages });
}
