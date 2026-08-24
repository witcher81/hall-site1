import { mcpCorsHeaders, mcpDiscoveryDocument } from "@/lib/mcpDiscovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: mcpCorsHeaders() });
}

export function GET() {
  return Response.json(mcpDiscoveryDocument(), { headers: mcpCorsHeaders() });
}
