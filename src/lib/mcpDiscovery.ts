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

export function mcpCorsHeaders(extra?: Record<string, string>): Record<string, string> {
  return { ...CORS, ...extra };
}

const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2024-11-05"] as const;

/**
 * Official MCP server card (matches is-agentic / MCP Registry shape).
 * Served at /.well-known/mcp, /server.json, and /.well-known/mcp/server-card.json.
 */
export function mcpServerCard() {
  const base = getSiteUrl();
  const mcpUrl = `${base}/mcp`;
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
    name: "com.eventforyou/public-mcp",
    title: `${SITE_BRAND} Public MCP`,
    description:
      "Read-only EventForYou tools: search halls/venues, freelancer services, providers, and site overview. No auth required.",
    version: "1.0.0",
    websiteUrl: base,
    remotes: [
      {
        type: "streamable-http",
        url: mcpUrl,
        supportedProtocolVersions: [...PROTOCOL_VERSIONS],
      },
    ],
  };
}

/** @deprecated Prefer mcpServerCard — kept for tests that expect handshake.live */
export function mcpDiscoveryDocument() {
  const card = mcpServerCard();
  const base = getSiteUrl();
  const mcpUrl = `${base}/mcp`;
  return {
    ...card,
    protocol: "mcp",
    mcp_version: "2025-11-25",
    transport: "streamable-http",
    server_name: card.title,
    server_version: card.version,
    product: SITE_BRAND,
    product_aliases: ["EventForYou"],
    endpoints: card.remotes.map((r) => ({
      url: r.url,
      transport: r.type,
      capabilities: ["tools"],
      auth: { type: "none" },
    })),
    streamable_http: mcpUrl,
    handshake: {
      live: true,
      status: "ready",
      method: "POST",
      url: mcpUrl,
      well_known: `${base}/.well-known/mcp`,
      well_known_post: `${base}/mcp`,
      content_type: "application/json",
      accept: "application/json, text/event-stream",
      protocol_header: "MCP-Protocol-Version",
      initialize: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
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

export function mcpRegistryManifest() {
  const card = mcpServerCard();
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
    name: card.name,
    title: card.title,
    description: card.description,
    version: card.version,
    websiteUrl: card.websiteUrl,
    remotes: card.remotes.map(({ type, url }) => ({ type, url })),
  };
}

export function aiCatalogDocument() {
  const base = getSiteUrl();
  return {
    specVersion: "1.0",
    entries: [
      {
        identifier: `urn:air:hall-site1.vercel.app:mcp:eventforyou`,
        type: "application/mcp-server-card+json",
        url: `${base}/.well-known/mcp/server-card.json`,
      },
    ],
  };
}
