import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";
import { v1ResponseHeaders } from "@/lib/apiVersionHeaders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/v1/deprecation — machine-readable Deprecation/Sunset policy. */
export async function GET() {
  const base = getSiteUrl();
  return Response.json(
    {
      name: `${SITE_BRAND} API deprecation policy`,
      apiVersion: "1",
      deprecated: false,
      sunset: null,
      sunsetHeader: "Sent only after Deprecation: true, as an HTTP-date (RFC 8594)",
      deprecationHeader: "Deprecation: false on active v1; Deprecation: true when scheduled",
      noticeDaysMinimum: 90,
      versioning: {
        strategy: "url_path",
        current: "/api/v1",
        nextMajor: "/api/v2",
      },
      documentation: `${base}/deprecation`,
      openapi: `${base}/openapi.json`,
    },
    {
      headers: v1ResponseHeaders(),
    }
  );
}
