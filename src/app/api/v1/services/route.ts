import { NextRequest } from "next/server";
import { searchPublicProviders } from "@/lib/publicProvidersSearch";
import { problemResponse } from "@/lib/apiProblem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/services — versioned public service search (JSON).
 */
export async function GET(req: NextRequest) {
  try {
    const { services } = await searchPublicProviders(req.nextUrl.searchParams);
    return Response.json(
      {
        data: services,
        meta: {
          count: services.length,
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
      "services_search_failed",
      "Service search failed",
      "The public service search could not be completed.",
      "Retry shortly, or browse https://hall-site1.vercel.app/providers"
    );
  }
}
