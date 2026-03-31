import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { coordsForCity } from "@/lib/israel-city-coords";
import { jitterLatLng } from "@/lib/conversation-utils";

export const runtime = "nodejs";

/** אולמות למפה: קואורדינטות מגיאוקוד כתובת (מדויקות) או נפילה למרכז עיר + ריסון קל */
export async function GET() {
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

  const markers = venues.map((v) => {
    const hasGeocoded =
      v.latitude != null &&
      v.longitude != null &&
      Number.isFinite(v.latitude) &&
      Number.isFinite(v.longitude);

    if (hasGeocoded) {
      return {
        id: v.id,
        name: v.name,
        city: v.city,
        address: v.address,
        lat: v.latitude as number,
        lng: v.longitude as number,
        approximate: false,
      };
    }

    const base = coordsForCity(v.city);
    const j = jitterLatLng(v.id, base);
    return {
      id: v.id,
      name: v.name,
      city: v.city,
      address: v.address,
      lat: j.lat,
      lng: j.lng,
      approximate: true,
    };
  });

  return NextResponse.json({ venues: markers });
}
