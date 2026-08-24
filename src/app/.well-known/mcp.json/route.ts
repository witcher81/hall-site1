import { NextResponse } from "next/server";
import { mcpCorsHeaders, mcpDiscoveryDocument } from "@/lib/mcpDiscovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Compatibility alias — official card is at /.well-known/mcp */
export function GET() {
  return NextResponse.json(mcpDiscoveryDocument(), {
    headers: mcpCorsHeaders(),
  });
}
