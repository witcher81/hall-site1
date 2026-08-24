import { v1ResponseHeaders } from "@/lib/apiVersionHeaders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/v1/health */
export async function GET() {
  return Response.json(
    {
      data: { ok: true, service: "eventforyou-public-api", apiVersion: "1" },
    },
    { headers: v1ResponseHeaders() }
  );
}
