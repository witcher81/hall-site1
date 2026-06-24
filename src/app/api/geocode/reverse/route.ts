import { NextRequest, NextResponse } from "next/server";
import { reverseGeocodeIsraelCoordinates } from "@/lib/geocode";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const result = await reverseGeocodeIsraelCoordinates(lat, lng);
  if (!result) {
    /** 200 — לא 404; הלקוח מצפה ל-JSON עם null ולא ל"נתיב לא קיים" */
    return NextResponse.json({ city: null, address: null });
  }

  return NextResponse.json({
    city: result.city ?? null,
    address: result.address ?? null,
  });
}

