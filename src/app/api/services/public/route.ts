import { NextRequest, NextResponse } from "next/server";
import { searchPublicProviders } from "@/lib/publicProvidersSearch";

export const runtime = "nodejs";

/** רשימת שירותים לציבור (מחפשים) – עם סינון אופציונלי */
export async function GET(req: NextRequest) {
  const { services } = await searchPublicProviders(req.nextUrl.searchParams);
  return NextResponse.json({ services });
}
