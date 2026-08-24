import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const base = getSiteUrl();
  return Response.json(
    {
      mcp_version: "1.0",
      server_name: `${SITE_BRAND} Public MCP`,
      server_version: "1.0.0",
      endpoints: {
        streamable_http: `${base}/mcp`,
      },
      capabilities: {
        tools: true,
        resources: false,
        prompts: false,
      },
      authentication: {
        required: false,
        methods: [],
      },
      documentation: `${base}/developers`,
      privacy_policy: `${base}/privacy`,
      terms_of_service: `${base}/terms`,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}
