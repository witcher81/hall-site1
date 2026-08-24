import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";
import { v1ResponseHeaders } from "@/lib/apiVersionHeaders";
import { problemResponse } from "@/lib/apiProblem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1 — public API index for agents (discoverability + versioning policy).
 */
export async function GET() {
  const base = getSiteUrl();
  return Response.json(
    {
      name: `${SITE_BRAND} Public API`,
      apiVersion: "1",
      versioning: {
        strategy: "url_path",
        current: "/api/v1",
        deprecation:
          "Breaking changes require a new major path (/api/v2). Deprecated versions will send Deprecation and Sunset response headers when scheduled.",
      },
      documentation: `${base}/developers`,
      openapi: `${base}/openapi.json`,
      llmsTxt: `${base}/llms.txt`,
      mcp: `${base}/mcp`,
      mcpDiscovery: `${base}/.well-known/mcp`,
      endpoints: [
        {
          method: "GET",
          path: "/api/v1/venues",
          operationId: "searchVenuesV1",
          description: "Search public event venues/halls",
        },
        {
          method: "GET",
          path: "/api/v1/services",
          operationId: "searchServicesV1",
          description: "Search public freelancer services",
        },
        {
          method: "GET",
          path: "/api/v1/health",
          operationId: "healthV1",
          description: "Liveness check for the public API",
        },
      ],
      errors: {
        contentType: "application/problem+json",
        schema: {
          type: "object",
          required: ["type", "title", "status", "detail", "code"],
          properties: {
            type: { type: "string" },
            title: { type: "string" },
            status: { type: "integer" },
            detail: { type: "string" },
            code: { type: "string" },
            hint: { type: "string" },
          },
        },
      },
    },
    {
      headers: v1ResponseHeaders(),
    }
  );
}

export async function POST() {
  return problemResponse(
    405,
    "method_not_allowed",
    "Method Not Allowed",
    "POST is not supported on /api/v1. Use GET.",
    "Call GET /api/v1 for the API index, or GET /api/v1/venues and /api/v1/services."
  );
}
