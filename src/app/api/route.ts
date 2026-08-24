import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";
import { problemResponse } from "@/lib/apiProblem";
import { v1ResponseHeaders } from "@/lib/apiVersionHeaders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api — catalog so agents detect a JSON API at the conventional /api path. */
export async function GET() {
  const base = getSiteUrl();
  return Response.json(
    {
      name: `${SITE_BRAND} Public API`,
      errorModel: "application/problem+json",
      current: `${base}/api/v1`,
      documentation: `${base}/developers`,
      docs: `${base}/docs`,
      openapi: `${base}/openapi.json`,
    },
    { headers: v1ResponseHeaders() }
  );
}

export async function POST() {
  return problemResponse(
    405,
    "method_not_allowed",
    "Method Not Allowed",
    "POST is not supported on /api. Use GET /api or GET /api/v1.",
    "Call GET /api for the catalog or GET /api/v1 for versioned endpoints."
  );
}
