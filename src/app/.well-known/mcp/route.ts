import { NextRequest, NextResponse } from "next/server";
import { handleMcpPost } from "@/lib/mcp/httpHandler";
import { mcpCorsHeaders, mcpDiscoveryDocument } from "@/lib/mcpDiscovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mcpCorsHeaders() });
}

/**
 * Live MCP discovery + handshake surface.
 * GET → discovery manifest; POST → JSON-RPC initialize / tools (same as /mcp).
 */
export function GET() {
  return NextResponse.json(mcpDiscoveryDocument(), {
    headers: mcpCorsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  return handleMcpPost(req);
}
