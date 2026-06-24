import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { venuesToMapMarkers } from "@/lib/venueMapMarkers";

export const runtime = "nodejs";

/** תקרה למניעת טעינת כל הטבלה (DoS/זיכרון) — מספיק גבוה לכל מצב מציאותי */
const MAX_MAP_VENUES = 5000;

/** אולמות למפה: קואורדינטות מגיאוקוד כתובת (מדויקות) או נפילה למרכז עיר + ריסון קל */
export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
      take: MAX_MAP_VENUES,
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    });

    return NextResponse.json({ venues: venuesToMapMarkers(venues) });
  } catch (e) {
    console.error("venues/map GET:", e);
    return NextResponse.json(
      { error: "Failed to load venues for map", venues: [] },
      { status: 500 }
    );
  }
}
