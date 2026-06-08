import { NextRequest, NextResponse } from "next/server";
import { searchPublicVenues } from "@/lib/publicVenuesSearch";

/**
 * רשימת אולמות לציבור (מחפשים) – עם סינון אופציונלי
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { venues, warning } = await searchPublicVenues(searchParams);
  return NextResponse.json({ venues, warning: warning ?? null });
}
