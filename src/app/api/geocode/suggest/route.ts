import { NextRequest, NextResponse } from "next/server";
import { suggestStreetsInCity } from "@/lib/geocodeSuggest";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = (searchParams.get("city")?.trim() ?? "").slice(0, 120);
  const q = (searchParams.get("q")?.trim() ?? "").slice(0, 120);

  if (!city || q.length < 2) {
    return NextResponse.json({ suggestions: [] as unknown[] });
  }

  try {
    const suggestions = await suggestStreetsInCity(city, q);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
