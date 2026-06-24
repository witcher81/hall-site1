import { NextRequest, NextResponse } from "next/server";
import { geocodeIsraelAddress, geocodeIsraelCity } from "@/lib/geocode";

export const runtime = "nodejs";
/** כתובת עם גיאוקוד חיצוני — לא יותר מהסביבה המאפשרת (Vercel וכו') */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = (searchParams.get("city")?.trim() ?? "").slice(0, 120);
  const address = (searchParams.get("address")?.trim() ?? "").slice(0, 200);

  if (!city) {
    return NextResponse.json(
      { error: "חסרה עיר", lat: null, lng: null, mode: null },
      { status: 400 }
    );
  }

  if (address.length > 0) {
    const coords = await geocodeIsraelAddress(address, city);
    if (!coords) {
      return NextResponse.json({
        lat: null,
        lng: null,
        mode: "address" as const,
        found: false,
      });
    }
    return NextResponse.json({
      lat: coords.lat,
      lng: coords.lng,
      mode: "address" as const,
      found: true,
    });
  }

  const coords = await geocodeIsraelCity(city);
  if (!coords) {
    return NextResponse.json({
      lat: null,
      lng: null,
      mode: "city" as const,
      found: false,
    });
  }
  return NextResponse.json({
    lat: coords.lat,
    lng: coords.lng,
    mode: "city" as const,
    found: true,
  });
}
