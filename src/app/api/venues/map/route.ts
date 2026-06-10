import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { venuesToMapMarkers } from "@/lib/venueMapMarkers";

export const runtime = "nodejs";

/** אולמות למפה: קואורדינטות מגיאוקוד כתובת (מדויקות) או נפילה למרכז עיר + ריסון קל */
export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
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
