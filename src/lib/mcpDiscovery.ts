import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";

const CORS = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "public, max-age=3600",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, MCP-Protocol-Version, Mcp-Method, Mcp-Name",
} as const;

export function mcpCorsHeaders(): Record<string, string> {
  return { ...CORS };
}

/** SEP-1960-style discovery document + live handshake instructions. */
export function mcpDiscoveryDocument() {
  const base = getSiteUrl();
  const mcpUrl = `${base}/mcp`;
  return {
    protocol: "mcp",
    mcp_version: "2025-11-25",
    transport: "streamable-http",
    server_name: `${SITE_BRAND} Public MCP`,
    server_version: "1.0.0",
    product: SITE_BRAND,
    product_aliases: ["EventForYou"],
    endpoints: [
      {
        url: mcpUrl,
        transport: "streamable-http",
        capabilities: ["tools"],
        auth: { type: "none" },
      },
    ],
    streamable_http: mcpUrl,
    handshake: {
      live: true,
      status: "ready",
      method: "POST",
      url: mcpUrl,
      well_known: `${base}/.well-known/mcp`,
      well_known_post: `${base}/.well-known/mcp`,
      content_type: "application/json",
      accept: "application/json",
      protocol_header: "MCP-Protocol-Version",
      initialize: {
        jsonrpc: "2.0",
        id: 1,
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
    docs: `${base}/docs`,
    openapi: `${base}/openapi.json`,
    llms_txt: `${base}/llms.txt`,
    api_v1: `${base}/api/v1`,
    privacy_policy: `${base}/privacy`,
    terms_of_service: `${base}/terms`,
    contact: `${base}/contact`,
  };
}

export function mcpServerCard() {
  const base = getSiteUrl();
  return {
    $schema: "https://modelcontextprotocol.io/schemas/server-card/v1.0",
    version: "1.0",
    protocolVersion: "2024-11-05",
    serverInfo: {
      name: `${SITE_BRAND} Public MCP`,
      version: "1.0.0",
      description: `Read-only EventForYou tools: search halls, services, and site overview.`,
      homepage: `${base}/developers`,
    },
    transport: {
      type: "streamable-http",
      url: `${base}/mcp`,
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false,
    },
    authentication: { required: false },
  };
}
