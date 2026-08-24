export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/v1/health */
export async function GET() {
  return Response.json(
    {
      data: { ok: true, service: "eventforyou-public-api", apiVersion: "1" },
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "API-Version": "1",
      },
    }
  );
}
