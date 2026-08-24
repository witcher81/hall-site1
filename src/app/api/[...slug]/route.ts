import { problemResponse } from "@/lib/apiProblem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound(pathHint: string) {
  return problemResponse(
    404,
    "not_found",
    "Not Found",
    `No public API route matches ${pathHint}.`,
    "Use GET /api or GET /api/v1 for the catalog. Docs: /developers OpenAPI: /openapi.json"
  );
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await ctx.params;
  return notFound(`/api/${(slug ?? []).join("/")}`);
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await ctx.params;
  return notFound(`/api/${(slug ?? []).join("/")}`);
}

export async function PUT(
  _req: Request,
  ctx: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await ctx.params;
  return notFound(`/api/${(slug ?? []).join("/")}`);
}

export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await ctx.params;
  return notFound(`/api/${(slug ?? []).join("/")}`);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await ctx.params;
  return notFound(`/api/${(slug ?? []).join("/")}`);
}
