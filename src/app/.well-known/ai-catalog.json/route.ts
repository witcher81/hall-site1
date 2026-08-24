import { NextResponse } from "next/server";
import { aiCatalogDocument, mcpCorsHeaders } from "@/lib/mcpDiscovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(aiCatalogDocument(), {
    headers: mcpCorsHeaders(),
  });
}
