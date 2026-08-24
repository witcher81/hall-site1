import { NextResponse } from "next/server";
import { mcpCorsHeaders, mcpServerCard } from "@/lib/mcpDiscovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mcpCorsHeaders() });
}

export function GET() {
  return NextResponse.json(mcpServerCard(), { headers: mcpCorsHeaders() });
}
