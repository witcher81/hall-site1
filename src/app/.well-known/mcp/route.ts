import { NextRequest, NextResponse } from "next/server";
import { handleMcpPost } from "@/lib/mcp/httpHandler";
import { mcpCorsHeaders, mcpServerCard } from "@/lib/mcpDiscovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mcpCorsHeaders() });
}

/**
 * Official MCP server card (GET) + optional live JSON-RPC handshake (POST).
 * Shape matches MCP Registry / is-agentic well-known discovery.
 */
export function GET() {
  return NextResponse.json(mcpServerCard(), {
    headers: mcpCorsHeaders({
      "Content-Type": "application/json; charset=utf-8",
    }),
  });
}

export async function POST(req: NextRequest) {
  return handleMcpPost(req);
}
