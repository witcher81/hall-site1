import { NextRequest, NextResponse } from "next/server";
import { MCP_TOOLS } from "@/lib/mcp/server";
import { handleMcpPost } from "@/lib/mcp/httpHandler";
import { SITE_BRAND } from "@/lib/siteBrand";
import { getSiteUrl } from "@/lib/siteUrl";
import { mcpCorsHeaders } from "@/lib/mcpDiscovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mcpCorsHeaders() });
}

/** Discovery-friendly GET for humans/agents probing the endpoint. */
export function GET() {
  const base = getSiteUrl();
  return NextResponse.json(
    {
      name: `${SITE_BRAND} Public MCP`,
      transport: "streamable-http",
      discovery: `${base}/.well-known/mcp`,
      usage: "POST JSON-RPC 2.0 (initialize, tools/list, tools/call)",
      tools: MCP_TOOLS.map((t) => t.name),
    },
    { headers: mcpCorsHeaders() }
  );
}

export async function POST(req: NextRequest) {
  return handleMcpPost(req);
}
