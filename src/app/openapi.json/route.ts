import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const base = getSiteUrl();
  const spec = {
    openapi: "3.1.0",
    info: {
      title: `${SITE_BRAND} Public API`,
      version: "1.0.0",
      description:
        "Read-only public endpoints for searching venues and services. Authenticated product APIs are out of scope.",
      contact: { url: `${base}/developers` },
    },
    servers: [{ url: base }],
    paths: {
      "/api/venues": {
        get: {
          summary: "Search public venues",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "city", in: "query", schema: { type: "string" } },
            { name: "guests", in: "query", schema: { type: "integer" } },
          ],
          responses: {
            "200": { description: "Venue list JSON" },
          },
        },
      },
      "/api/services/public": {
        get: {
          summary: "Search public services",
          responses: {
            "200": { description: "Service list JSON" },
          },
        },
      },
      "/mcp": {
        post: {
          summary: "EventForYou MCP Streamable HTTP endpoint",
          responses: {
            "200": { description: "JSON-RPC MCP response" },
          },
        },
      },
      "/.well-known/mcp": {
        get: {
          summary: "MCP discovery metadata",
          responses: {
            "200": { description: "Discovery JSON" },
          },
        },
      },
    },
  };

  return Response.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
