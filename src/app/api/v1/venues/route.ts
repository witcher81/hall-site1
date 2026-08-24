import { NextRequest } from "next/server";
import { searchPublicVenues } from "@/lib/publicVenuesSearch";
import { problemResponse } from "@/lib/apiProblem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/venues — versioned public venue search (JSON).
 */
export async function GET(req: NextRequest) {
  try {
    const { venues, warning } = await searchPublicVenues(req.nextUrl.searchParams);
    return Response.json(
      {
        data: venues,
        meta: {
          count: venues.length,
          warning: warning ?? null,
          apiVersion: "1",
        },
      },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Deprecation": "false",
          "API-Version": "1",
        },
      }
    );
  } catch {
    return problemResponse(
      500,
      "venues_search_failed",
      "Venue search failed",
      "The public venue search could not be completed.",
      "Retry shortly, or browse https://hall-site1.vercel.app/halls"
    );
  }
}
