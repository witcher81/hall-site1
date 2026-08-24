import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * MCP discovery / handshake document for agents.
 * Clients: GET this URL, then POST JSON-RPC to endpoints.streamable_http.
 */
export function GET() {
  const base = getSiteUrl();
  const mcpUrl = `${base}/mcp`;
  return Response.json(
    {
      protocol: "mcp",
      mcp_version: "1.0",
      transport: "streamable-http",
      server_name: `${SITE_BRAND} Public MCP`,
      server_version: "1.0.0",
      product: SITE_BRAND,
      product_aliases: ["EventForYou"],
      endpoints: {
        streamable_http: mcpUrl,
        mcp: mcpUrl,
      },
      handshake: {
        method: "POST",
        url: mcpUrl,
        content_type: "application/json",
        accept: "application/json",
        initialize: {
          jsonrpc: "2.0",
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "agent", version: "1.0.0" },
          },
        },
        next: ["notifications/initialized", "tools/list", "tools/call"],
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
      openapi: `${base}/openapi.json`,
      llms_txt: `${base}/llms.txt`,
      api_v1: `${base}/api/v1`,
      privacy_policy: `${base}/privacy`,
      terms_of_service: `${base}/terms`,
      contact: `${base}/contact`,
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}
