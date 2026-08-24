import { NextResponse } from "next/server";
import { mcpCorsHeaders, mcpRegistryManifest } from "@/lib/mcpDiscovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** MCP Registry manifest (same role as is-agentic.com/server.json). */
export function GET() {
  return NextResponse.json(mcpRegistryManifest(), {
    headers: mcpCorsHeaders(),
  });
}
